import type Stripe from "stripe";

import { NextResponse } from "next/server";

import {
  mapStripeV2AccountStatus,
  type StripeAccountStatus,
} from "@/domain/users/stripe-account-status";
import { getPrisma } from "@/lib/db";
import { getStripe, stripeWebhookSecret } from "@/lib/stripe";

type StripeClientWithNotificationParser = Stripe & {
  parseEventNotificationAsync?: StripeWebhookClient["parseEventNotificationAsync"];
  webhooks: StripeWebhookClient;
};
type StripeV2AccountsClient = {
  retrieve?: (
    accountId: string,
    params?: { include?: string[] },
  ) => Promise<unknown>;
};
type StripeWebhookClient = {
  constructEventAsync: (
    payload: string,
    header: string,
    secret: string,
  ) => Promise<unknown>;
  parseEventNotificationAsync?: (
    payload: string,
    header: string,
    secret: string,
  ) => Promise<unknown>;
};
type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null;

function isThinV2NotificationPayload(rawBody: string) {
  try {
    const payload: unknown = JSON.parse(rawBody);
    return isRecord(payload) && payload.object === "v2.core.event";
  } catch {
    return false;
  }
}

async function parseV2Notification(
  stripe: Stripe,
  rawBody: string,
  signature: string,
  secret: string,
) {
  const client = stripe as unknown as StripeClientWithNotificationParser;
  const parser =
    client.webhooks.parseEventNotificationAsync ??
    client.parseEventNotificationAsync;
  if (typeof parser !== "function") {
    throw new Error("Stripe v2 notification parser is unavailable");
  }

  const parserOwner = client.webhooks.parseEventNotificationAsync
    ? client.webhooks
    : client;
  return parser.call(parserOwner, rawBody, signature, secret);
}

const isStripeV2AccountEvent = (eventType: string) =>
  eventType.startsWith("v2.core.account.") ||
  eventType.startsWith("v2.core.account[");

export { mapStripeV2AccountStatus };

export function mapStripeAccountStatus(
  account: Stripe.Account,
): StripeAccountStatus {
  if (account.requirements?.disabled_reason) {
    if (
      account.requirements.disabled_reason.startsWith("rejected.") ||
      account.requirements.disabled_reason.startsWith("listed.")
    ) {
      return "DISABLED";
    }
    return "RESTRICTED";
  }

  if (
    account.requirements?.past_due &&
    account.requirements.past_due.length > 0
  ) {
    return "RESTRICTED";
  }

  const isActivated =
    Boolean(account.details_submitted) &&
    Boolean(account.charges_enabled) &&
    Boolean(account.payouts_enabled);

  if (isActivated) {
    return "ACTIVATED";
  }

  return "PENDING";
}

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  const rawBody = await req.text();
  const stripe = getStripe();

  const isThinNotification = isThinV2NotificationPayload(rawBody);
  let event: UnknownRecord;
  try {
    const parsedEvent = isThinNotification
      ? await parseV2Notification(
          stripe,
          rawBody,
          signature,
          stripeWebhookSecret(),
        )
      : await stripe.webhooks.constructEventAsync(
          rawBody,
          signature,
          stripeWebhookSecret(),
        );
    if (!isRecord(parsedEvent)) {
      throw new Error("Stripe webhook parser returned an invalid event");
    }
    event = parsedEvent;
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Webhook signature verification failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const eventType = typeof event.type === "string" ? event.type : undefined;
  if (eventType === "account.updated") {
    const eventData = isRecord(event.data) ? event.data : {};
    const account = eventData.object as Stripe.Account;
    const userId = account.metadata?.userId;
    const status = mapStripeAccountStatus(account);
    const prisma = getPrisma();

    if (userId) {
      await prisma.user.update({
        data: {
          stripeAccountId: account.id,
          stripeAccountStatus: status,
        },
        where: { id: userId },
      });
    } else if (account.id) {
      await prisma.user.updateMany({
        data: {
          stripeAccountStatus: status,
        },
        where: { stripeAccountId: account.id },
      });
    }
  } else if (eventType && isStripeV2AccountEvent(eventType)) {
    const eventData = isRecord(event.data) ? event.data : {};
    const source = isThinNotification
      ? event
      : isRecord(eventData.object)
        ? eventData.object
        : eventData;
    const account = getV2AccountObject(source);
    if (!account) {
      return NextResponse.json(
        { error: "Stripe v2 account event is missing an account object" },
        { status: 400 },
      );
    }

    let accountForStatus = account;
    if (!hasCompleteV2AccountState(account)) {
      const accountId = getAccountId(account, source);
      if (!accountId) {
        return NextResponse.json(
          { error: "Stripe v2 account event is missing an account id" },
          { status: 400 },
        );
      }

      let retrievedAccount: undefined | UnknownRecord;
      try {
        retrievedAccount = await retrieveV2Account(stripe, accountId);
      } catch {
        return v2AccountRetrievalError();
      }
      if (!retrievedAccount) {
        return v2AccountRetrievalError();
      }
      accountForStatus = {
        ...account,
        ...retrievedAccount,
        metadata:
          retrievedAccount.metadata ?? account.metadata ?? source.metadata,
      };
    }

    await persistAccountStatus(
      accountForStatus,
      source,
      mapStripeV2AccountStatus(accountForStatus),
    );
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

function getAccountId(account: UnknownRecord, source: UnknownRecord) {
  for (const candidate of [
    account.id,
    source.account_id,
    source.account,
    source.related_object,
    source.object,
  ]) {
    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate;
    }
  }
  return undefined;
}

function getV2AccountObject(value: unknown): undefined | UnknownRecord {
  if (!isRecord(value)) {
    return undefined;
  }

  for (const key of ["account", "account_object", "related_object"]) {
    const nested = value[key];
    if (isRecord(nested)) {
      return nested;
    }
  }

  return value;
}

function hasCompleteV2AccountState(account: UnknownRecord) {
  const configuration = account.configuration;
  if (!isRecord(configuration)) {
    return false;
  }

  const hasCapabilities = (configurationName: "merchant" | "recipient") => {
    const selected = configuration[configurationName];
    return (
      isRecord(selected) &&
      isRecord(selected.capabilities) &&
      Object.keys(selected.capabilities).length > 0
    );
  };

  return (
    hasCapabilities("merchant") &&
    hasCapabilities("recipient") &&
    Object.prototype.hasOwnProperty.call(account, "requirements")
  );
}

async function persistAccountStatus(
  account: UnknownRecord,
  source: UnknownRecord,
  status: StripeAccountStatus,
) {
  const accountId = getAccountId(account, source);
  if (!accountId) {
    return;
  }

  const metadata = account.metadata;
  const userId =
    isRecord(metadata) && typeof metadata.userId === "string"
      ? metadata.userId
      : undefined;
  const prisma = getPrisma();

  if (userId) {
    await prisma.user.update({
      data: {
        stripeAccountId: accountId,
        stripeAccountStatus: status,
      },
      where: { id: userId },
    });
  } else {
    await prisma.user.updateMany({
      data: {
        stripeAccountStatus: status,
      },
      where: { stripeAccountId: accountId },
    });
  }
}

async function retrieveV2Account(
  stripe: Stripe,
  accountId: string,
): Promise<undefined | UnknownRecord> {
  const accounts = (
    stripe as unknown as {
      v2?: { core?: { accounts?: StripeV2AccountsClient } };
    }
  ).v2?.core?.accounts;
  if (typeof accounts?.retrieve !== "function") {
    return undefined;
  }

  const account = await accounts.retrieve(accountId, {
    include: [
      "configuration.merchant",
      "configuration.recipient",
      "requirements",
    ],
  });
  return isRecord(account) ? account : undefined;
}

function v2AccountRetrievalError() {
  return NextResponse.json(
    { error: "Unable to retrieve Stripe v2 account" },
    { status: 500 },
  );
}

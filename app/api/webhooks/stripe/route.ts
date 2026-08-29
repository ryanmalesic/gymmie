import type Stripe from "stripe";

import { NextResponse } from "next/server";

import { getPrisma } from "@/lib/db";
import { getStripe, stripeWebhookSecret } from "@/lib/stripe";

export function mapStripeAccountStatus(
  account: Stripe.Account,
): "ACTIVATED" | "DISABLED" | "PENDING" | "RESTRICTED" {
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

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      stripeWebhookSecret(),
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Webhook signature verification failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case "account.updated": {
      const account = event.data.object;
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
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

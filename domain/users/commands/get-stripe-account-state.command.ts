import "server-only";

import { mapStripeV2AccountStatus } from "@/domain/users/stripe-account-status";
import { defineCommand, type InferCommand } from "@/lib/commands/base";
import { InternalError, NotFoundError } from "@/lib/commands/errors";
import { getStripe } from "@/lib/stripe";
import { z } from "@/lib/zod";

const capabilityStateSchema = z
  .object({
    status: z.string(),
    statusDetails: z.array(
      z
        .object({
          code: z.string(),
          resolution: z.string(),
        })
        .strict(),
    ),
  })
  .strict();

const requirementErrorSchema = z
  .object({
    code: z.string(),
    description: z.string(),
    requirement: z.string(),
  })
  .strict();

const requestSchema = z
  .object({})
  .strict()
  .openapi("GetMyStripeAccountStateRequest");

const responseSchema = z
  .object({
    actionableRemediation: z.boolean(),
    currentlyDue: z.array(z.string()),
    eventuallyDue: z.array(z.string()),
    merchantCapabilities: z.record(z.string(), capabilityStateSchema),
    pastDue: z.array(z.string()),
    pendingVerification: z.array(z.string()),
    recipientCapabilities: z.record(z.string(), capabilityStateSchema),
    requirements: z
      .object({
        currentDeadline: z.string().nullable(),
        errors: z.array(requirementErrorSchema),
      })
      .strict(),
    stripeAccountId: z.string().nullable(),
    stripeAccountStatus: z
      .enum(["ACTIVATED", "DISABLED", "PENDING", "RESTRICTED"])
      .nullable(),
  })
  .strict()
  .openapi("GetMyStripeAccountStateResponse");

type UnknownRecord = Record<string, unknown>;

function hasActionableCapabilityRemediation(
  capabilities: Record<
    string,
    {
      status: string;
      statusDetails: Array<{ code: string; resolution: string }>;
    }
  >,
) {
  return Object.values(capabilities).some(
    ({ status, statusDetails }) =>
      status === "restricted" &&
      statusDetails.some(
        ({ code, resolution }) =>
          code === "requirements_past_due" && resolution === "provide_info",
      ),
  );
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function normalizeCapabilityStates(value: unknown) {
  const states: Record<
    string,
    {
      status: string;
      statusDetails: Array<{ code: string; resolution: string }>;
    }
  > = {};

  function visit(current: unknown, path: string) {
    if (!isRecord(current)) {
      return;
    }

    if (typeof current.status === "string") {
      const statusDetails = Array.isArray(current.status_details)
        ? current.status_details.flatMap((detail) => {
            if (!isRecord(detail)) {
              return [];
            }

            const code =
              typeof detail.code === "string" ? detail.code : undefined;
            const resolution =
              typeof detail.resolution === "string"
                ? detail.resolution
                : undefined;
            return code && resolution ? [{ code, resolution }] : [];
          })
        : [];

      states[path] = { status: current.status, statusDetails };
      return;
    }

    for (const [key, child] of Object.entries(current)) {
      visit(
        child,
        key === "capabilities" ? path : path ? `${path}.${key}` : key,
      );
    }
  }

  visit(value, "");
  return states;
}

function normalizeStripeAccountState(
  account: unknown,
  stripeAccountStatus: z.infer<typeof responseSchema>["stripeAccountStatus"],
) {
  const accountRecord = isRecord(account) ? account : {};
  const configuration = isRecord(accountRecord.configuration)
    ? accountRecord.configuration
    : {};
  const requirements = isRecord(accountRecord.requirements)
    ? accountRecord.requirements
    : {};
  const entries = Array.isArray(requirements.entries)
    ? requirements.entries.filter(isRecord)
    : [];
  const currentlyDue: string[] = [];
  const eventuallyDue: string[] = [];
  const pastDue: string[] = [];
  const pendingVerification: string[] = [];
  const errors: Array<{
    code: string;
    description: string;
    requirement: string;
  }> = [];
  let actionableRemediation = false;

  for (const entry of entries) {
    const identifier = safeIdentifier(entry.description);
    if (!identifier) {
      continue;
    }

    const deadline = isRecord(entry.minimum_deadline)
      ? entry.minimum_deadline.status
      : entry.minimum_deadline;
    const awaitingActionFrom = entry.awaiting_action_from;

    if (awaitingActionFrom === "stripe") {
      pendingVerification.push(identifier);
    }
    if (deadline === "past_due") {
      pastDue.push(identifier);
    } else if (deadline === "eventually_due") {
      eventuallyDue.push(identifier);
    } else if (deadline === "currently_due") {
      currentlyDue.push(identifier);
    }

    const entryErrors = Array.isArray(entry.errors) ? entry.errors : [];
    for (const error of entryErrors) {
      if (!isRecord(error)) {
        continue;
      }

      const code = safeIdentifier(error.code);
      const description =
        typeof error.description === "string" ? error.description : undefined;
      if (code && description) {
        errors.push({ code, description, requirement: identifier });
      }
    }

    const isNonSelfService =
      identifier.startsWith("support") ||
      identifier.startsWith("notice") ||
      identifier.startsWith("underwriting_case");
    if (
      awaitingActionFrom === "user" &&
      !isNonSelfService &&
      (deadline === "currently_due" || deadline === "past_due")
    ) {
      actionableRemediation = true;
    }
  }

  const summary = isRecord(requirements.summary)
    ? requirements.summary
    : undefined;
  const summaryDeadline = summary?.minimum_deadline;
  const entryDeadline = entries
    .map((entry) =>
      isRecord(entry.minimum_deadline)
        ? entry.minimum_deadline.status
        : entry.minimum_deadline,
    )
    .find((deadline) => safeIdentifier(deadline));
  const currentDeadline = isRecord(summaryDeadline)
    ? (safeIdentifier(summaryDeadline.status) ?? null)
    : (safeIdentifier(summaryDeadline) ??
      safeIdentifier(entryDeadline) ??
      null);

  const merchantCapabilities = normalizeCapabilityStates(
    configuration.merchant,
  );
  const recipientCapabilities = normalizeCapabilityStates(
    configuration.recipient,
  );
  if (
    hasActionableCapabilityRemediation(merchantCapabilities) ||
    hasActionableCapabilityRemediation(recipientCapabilities)
  ) {
    actionableRemediation = true;
  }

  return {
    actionableRemediation,
    currentlyDue,
    eventuallyDue,
    merchantCapabilities,
    pastDue,
    pendingVerification,
    recipientCapabilities,
    requirements: { currentDeadline, errors },
    stripeAccountId:
      typeof accountRecord.id === "string" ? accountRecord.id : null,
    stripeAccountStatus,
  };
}

function safeIdentifier(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length === 0) {
    return undefined;
  }

  if (value.includes("://") || value.startsWith("/")) {
    return undefined;
  }

  return value;
}

export const spec = defineCommand({
  load: {
    entity: "User",
    fetch: (user, _input, prisma) =>
      prisma.user.findUnique({ where: { id: user.id } }),
  },
  authorize: (user, _input, record) => record.id === user.id,
  name: "GetMyStripeAccountState",
  spec: {
    description:
      "Fetches the current authenticated user's normalized Stripe Account state.",
    request: { description: "Empty payload", schema: requestSchema },
    response: {
      description: "Frontend-safe Stripe Account state",
      schema: responseSchema,
      status: 200,
    },
    summary: "Fetch Stripe Account state",
    tags: ["Users", "Stripe"],
  },
});

const getMyStripeAccountState: InferCommand<typeof spec> = async (
  _input,
  { record },
) => {
  if (!record.stripeAccountId) {
    throw new NotFoundError("Stripe account", record.id);
  }

  try {
    const accounts = (
      getStripe() as unknown as {
        v2?: {
          core?: {
            accounts?: {
              retrieve: (
                id: string,
                params: { include: string[] },
              ) => Promise<unknown>;
            };
          };
        };
      }
    ).v2?.core?.accounts;

    if (typeof accounts?.retrieve !== "function") {
      throw new Error("Stripe v2 accounts namespace is unavailable");
    }

    const account = await accounts.retrieve(record.stripeAccountId, {
      include: [
        "configuration.merchant",
        "configuration.recipient",
        "requirements",
      ],
    });

    const stripeAccountStatus = mapStripeV2AccountStatus(
      isRecord(account) ? account : {},
    );
    return normalizeStripeAccountState(account, stripeAccountStatus);
  } catch {
    throw new InternalError("Unable to retrieve Stripe account state.");
  }
};

export { normalizeStripeAccountState };
export default getMyStripeAccountState;

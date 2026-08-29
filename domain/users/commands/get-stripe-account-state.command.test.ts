import { beforeEach, describe, expect, test, vi } from "vitest";

import getMyStripeAccountState, {
  normalizeStripeAccountState,
  spec,
} from "@/domain/users/commands/get-stripe-account-state.command";
import { InternalError, NotFoundError } from "@/lib/commands/errors";
import { type CommandContext } from "@/lib/commands/types";
import { type PrismaClient } from "@/lib/generated/prisma/client";
import { type User } from "@/lib/generated/zod/modelSchema/UserSchema";

const mockRetrieve = vi.fn();

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    v2: {
      core: {
        accounts: { retrieve: mockRetrieve },
      },
    },
  }),
}));

const user = {
  id: "usr_123",
  stripeAccountId: "acct_123",
  stripeAccountStatus: "PENDING",
} as User;

function context(record = user) {
  return {
    commandName: "GetMyStripeAccountState",
    prisma: {} as PrismaClient,
    record,
    session: {
      session: { expiresAt: new Date(), id: "s1" },
      user: { email: "ada@example.com", id: record.id },
    },
    version: "2026-08-28",
  } as CommandContext<typeof record>;
}

describe("GetMyStripeAccountState command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("authorizes only the loaded session user", () => {
    expect(spec.name).toBe("GetMyStripeAccountState");
    expect(
      spec.authorize(
        { email: "ada@example.com", id: user.id },
        {},
        user,
        {} as PrismaClient,
      ),
    ).toBe(true);
    expect(
      spec.authorize(
        { email: "other@example.com", id: "usr_other" },
        {},
        user,
        {} as PrismaClient,
      ),
    ).toBe(false);
  });

  test("derives current status from Stripe instead of stale database state", async () => {
    mockRetrieve.mockResolvedValue({
      configuration: {
        merchant: {
          capabilities: {
            card_payments: {
              status: "active",
              status_details: [],
            },
            stripe_balance: {
              payouts: {
                status: "active",
                status_details: [],
              },
            },
            us_bank_account_ach_payments: {
              status: "active",
              status_details: [],
            },
          },
        },
        recipient: {
          capabilities: {
            stripe_balance: {
              stripe_transfers: {
                status: "pending",
                status_details: [
                  {
                    code: "requirements_pending_verification",
                    resolution: "provide_info",
                  },
                ],
              },
            },
          },
        },
      },
      id: "acct_123",
      object: "v2.core.account",
      related_object: { url: "/v1/accounts/acct_123" },
      requirements: {
        entries: [
          {
            awaiting_action_from: "user",
            description: "individual.first_name",
            errors: [],
            minimum_deadline: { status: "currently_due" },
          },
          {
            awaiting_action_from: "user",
            description: "individual.dob",
            errors: [
              {
                code: "verification_document_invalid",
                description: "The document could not be verified.",
              },
            ],
            minimum_deadline: { status: "past_due" },
          },
          {
            awaiting_action_from: "stripe",
            description: "individual.verification.document",
            errors: [],
            minimum_deadline: { status: "eventually_due" },
          },
          {
            awaiting_action_from: "user",
            description: "support.phone",
            errors: [],
            minimum_deadline: { status: "currently_due" },
          },
        ],
        summary: { minimum_deadline: { status: "past_due" } },
      },
    });

    const result = await getMyStripeAccountState({}, context());

    expect(result).toEqual({
      actionableRemediation: true,
      currentlyDue: ["individual.first_name", "support.phone"],
      eventuallyDue: ["individual.verification.document"],
      merchantCapabilities: {
        card_payments: { status: "active", statusDetails: [] },
        "stripe_balance.payouts": {
          status: "active",
          statusDetails: [],
        },
        us_bank_account_ach_payments: {
          status: "active",
          statusDetails: [],
        },
      },
      pastDue: ["individual.dob"],
      pendingVerification: ["individual.verification.document"],
      recipientCapabilities: {
        "stripe_balance.stripe_transfers": {
          status: "pending",
          statusDetails: [
            {
              code: "requirements_pending_verification",
              resolution: "provide_info",
            },
          ],
        },
      },
      requirements: {
        currentDeadline: "past_due",
        errors: [
          {
            code: "verification_document_invalid",
            description: "The document could not be verified.",
            requirement: "individual.dob",
          },
        ],
      },
      stripeAccountId: "acct_123",
      stripeAccountStatus: "RESTRICTED",
    });
    expect(JSON.stringify(result)).not.toContain("related_object");
    expect(mockRetrieve).toHaveBeenCalledWith("acct_123", {
      include: [
        "configuration.merchant",
        "configuration.recipient",
        "requirements",
      ],
    });
  });

  test("does not mark a support requirement actionable and tolerates absent data", () => {
    expect(
      normalizeStripeAccountState(
        {
          configuration: {},
          id: "acct_123",
          requirements: {
            entries: [
              {
                awaiting_action_from: "user",
                description: "underwriting_case.review",
                minimum_deadline: { status: "currently_due" },
              },
            ],
          },
        },
        null,
      ),
    ).toEqual({
      actionableRemediation: false,
      currentlyDue: ["underwriting_case.review"],
      eventuallyDue: [],
      merchantCapabilities: {},
      pastDue: [],
      pendingVerification: [],
      recipientCapabilities: {},
      requirements: { currentDeadline: "currently_due", errors: [] },
      stripeAccountId: "acct_123",
      stripeAccountStatus: null,
    });
  });

  test("marks user-actionable capability requirements as remediation", () => {
    const result = normalizeStripeAccountState(
      {
        configuration: {
          merchant: {
            capabilities: {
              eps_payments: {
                status: "restricted",
                status_details: [
                  {
                    code: "requirements_past_due",
                    resolution: "provide_info",
                  },
                ],
              },
            },
          },
        },
        id: "acct_123",
        requirements: { entries: [] },
      },
      "RESTRICTED",
    );

    expect(result).toMatchObject({
      actionableRemediation: true,
      currentlyDue: [],
      eventuallyDue: [],
      merchantCapabilities: {
        eps_payments: {
          status: "restricted",
          statusDetails: [
            { code: "requirements_past_due", resolution: "provide_info" },
          ],
        },
      },
      pastDue: [],
      pendingVerification: [],
      requirements: { currentDeadline: null, errors: [] },
    });
  });

  test("returns safe errors for missing IDs and Stripe failures", async () => {
    await expect(
      getMyStripeAccountState(
        {},
        context({ ...user, stripeAccountId: null } as User),
      ),
    ).rejects.toBeInstanceOf(NotFoundError);

    mockRetrieve.mockRejectedValue(new Error("secret Stripe response details"));
    await expect(getMyStripeAccountState({}, context())).rejects.toEqual(
      new InternalError("Unable to retrieve Stripe account state."),
    );
    await expect(getMyStripeAccountState({}, context())).rejects.not.toThrow(
      "secret Stripe response details",
    );
  });
});

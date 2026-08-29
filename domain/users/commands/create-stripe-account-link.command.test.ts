import { beforeEach, describe, expect, test, vi } from "vitest";

import createStripeAccountLink, {
  spec,
} from "@/domain/users/commands/create-stripe-account-link.command";
import { InternalError, NotFoundError } from "@/lib/commands/errors";
import { type CommandContext } from "@/lib/commands/types";
import { type PrismaClient } from "@/lib/generated/prisma/client";
import { type User } from "@/lib/generated/zod/modelSchema/UserSchema";

const mockAccountsCreate = vi.fn();
const mockAccountLinksCreate = vi.fn();

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    v2: {
      core: {
        accountLinks: { create: mockAccountLinksCreate },
        accounts: { create: mockAccountsCreate },
      },
    },
  }),
}));

const user = {
  id: "usr_123",
  stripeAccountId: "acct_existing",
  stripeAccountStatus: "RESTRICTED",
} as User;

function context(record = user) {
  return {
    commandName: "CreateStripeAccountLink",
    prisma: {} as PrismaClient,
    record,
    session: {
      session: { expiresAt: new Date(), id: "s1" },
      user: { email: "ada@example.com", id: record.id },
    },
    version: "2026-08-28",
  } as CommandContext<typeof record>;
}

describe("CreateStripeAccountLink command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BETTER_AUTH_URL = "https://example.com";
  });

  test("creates an account_onboarding link for the existing account", async () => {
    mockAccountLinksCreate.mockResolvedValue({
      related_object: { url: "/v1/accounts/acct_existing" },
      url: "https://connect.stripe.com/setup/s/remediation",
    });

    const result = await createStripeAccountLink({}, context());

    expect(result).toEqual({
      accountLinkUrl: "https://connect.stripe.com/setup/s/remediation",
      stripeAccountId: "acct_existing",
    });
    expect(mockAccountsCreate).not.toHaveBeenCalled();
    expect(mockAccountLinksCreate).toHaveBeenCalledWith({
      account: "acct_existing",
      use_case: {
        account_onboarding: {
          configurations: ["merchant", "recipient"],
          refresh_url: "https://example.com/onboarding/stripe/refresh",
          return_url: "https://example.com/onboarding/stripe/return",
        },
        type: "account_onboarding",
      },
    });
    expect(JSON.stringify(result)).not.toContain("related_object");
  });

  test("uses the existing onboarding URL defaults", async () => {
    mockAccountLinksCreate.mockResolvedValue({
      url: "https://connect.stripe.com/setup/s/defaults",
    });

    await createStripeAccountLink({}, context());

    expect(mockAccountLinksCreate).toHaveBeenCalledWith({
      account: "acct_existing",
      use_case: {
        account_onboarding: {
          configurations: ["merchant", "recipient"],
          refresh_url: "https://example.com/onboarding/stripe/refresh",
          return_url: "https://example.com/onboarding/stripe/return",
        },
        type: "account_onboarding",
      },
    });
  });

  test("returns safe errors for missing IDs, unavailable namespaces, and failures", async () => {
    await expect(
      createStripeAccountLink(
        {},
        context({ ...user, stripeAccountId: null } as User),
      ),
    ).rejects.toBeInstanceOf(NotFoundError);

    mockAccountLinksCreate.mockRejectedValue(
      new Error("secret Stripe details"),
    );
    await expect(createStripeAccountLink({}, context())).rejects.toEqual(
      new InternalError("Unable to create Stripe account link."),
    );

    mockAccountLinksCreate.mockReturnValue(undefined);
    await expect(createStripeAccountLink({}, context())).rejects.toEqual(
      new InternalError("Unable to create Stripe account link."),
    );
  });

  test("only accepts secure URLs from Stripe", async () => {
    mockAccountLinksCreate.mockResolvedValue({
      url: "http://connect.stripe.com/setup/s/insecure",
    });

    await expect(createStripeAccountLink({}, context())).rejects.toEqual(
      new InternalError("Unable to create Stripe account link."),
    );
  });

  test("rejects caller-provided callback URLs", () => {
    expect(
      spec.spec.request.schema.safeParse({
        refreshUrl: "https://attacker.example/refresh",
        returnUrl: "https://attacker.example/return",
      }).success,
    ).toBe(false);
  });
  test("authorizes only the loaded session user", () => {
    expect(spec.name).toBe("CreateStripeAccountLink");
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
});

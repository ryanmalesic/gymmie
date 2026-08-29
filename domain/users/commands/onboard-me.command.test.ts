import { beforeEach, describe, expect, test, vi } from "vitest";

import onboardMe, { spec } from "@/domain/users/commands/onboard-me.command";
import { type CommandContext } from "@/lib/commands/types";
import { type PrismaClient } from "@/lib/generated/prisma/client";
import { type User } from "@/lib/generated/zod/modelSchema/UserSchema";

const mockStripeAccountsCreate = vi.fn();
const mockStripeAccountLinksCreate = vi.fn();

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    accountLinks: {
      create: mockStripeAccountLinksCreate,
    },
    accounts: {
      create: mockStripeAccountsCreate,
    },
  }),
}));

const validUser: User = {
  addressLine1: "123 Market St",
  addressLine2: "Suite 400",
  city: "San Francisco",
  country: "US",
  createdAt: new Date(),
  email: "ada@example.com",
  emailVerified: true,
  id: "usr_123",
  image: null,
  latitude: 37.7749,
  longitude: -122.4194,
  name: "Ada Lovelace",
  phone: "+1 (415) 555-1234",
  postalCode: "94107",
  state: "CA",
  stripeAccountId: null,
  stripeAccountStatus: null,
  timezone: "America/New_York",
  updatedAt: new Date(),
};

describe("OnboardMe command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BETTER_AUTH_URL = "https://example.com";
  });

  test("spec definition and authorization", () => {
    expect(spec.name).toBe("OnboardMe");

    // Profile complete user is authorized
    expect(
      spec.authorize(
        { email: validUser.email, id: validUser.id },
        {},
        validUser,
        {} as PrismaClient,
      ),
    ).toBe(true);

    // Profile incomplete user is rejected
    expect(
      spec.authorize(
        { email: validUser.email, id: validUser.id },
        {},
        { ...validUser, phone: null },
        {} as PrismaClient,
      ),
    ).toBe(false);
  });

  test("creates new Stripe account and returns account link if user has no stripeAccountId", async () => {
    mockStripeAccountsCreate.mockResolvedValue({ id: "acct_stripe_new" });
    mockStripeAccountLinksCreate.mockResolvedValue({
      url: "https://connect.stripe.com/setup/s/123",
    });

    const mockPrisma = {
      user: {
        update: vi.fn().mockResolvedValue({
          ...validUser,
          stripeAccountId: "acct_stripe_new",
        }),
      },
    };

    const context: CommandContext<typeof validUser> = {
      commandName: "OnboardMe",
      prisma: mockPrisma as unknown as PrismaClient,
      record: validUser,
      session: {
        session: { expiresAt: new Date(), id: "s1" },
        user: { email: validUser.email, id: validUser.id },
      },
      version: "2026-08-28",
    };

    const result = await onboardMe({}, context);

    expect(result).toEqual({
      accountLinkUrl: "https://connect.stripe.com/setup/s/123",
      stripeAccountId: "acct_stripe_new",
    });

    expect(mockStripeAccountsCreate).toHaveBeenCalledWith(
      {
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        country: "US",
        email: "ada@example.com",
        metadata: {
          userId: "usr_123",
        },
        type: "express",
      },
      {
        idempotencyKey: "usr_123",
      },
    );

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      data: {
        stripeAccountId: "acct_stripe_new",
        stripeAccountStatus: "PENDING",
      },
      where: { id: "usr_123" },
    });

    expect(mockStripeAccountLinksCreate).toHaveBeenCalledWith({
      account: "acct_stripe_new",
      refresh_url: "https://example.com/onboarding/stripe/refresh",
      return_url: "https://example.com/onboarding/stripe/return",
      type: "account_onboarding",
    });
  });

  test("reuses existing stripeAccountId if user already has one", async () => {
    mockStripeAccountLinksCreate.mockResolvedValue({
      url: "https://connect.stripe.com/setup/s/456",
    });

    const userWithStripe = {
      ...validUser,
      stripeAccountId: "acct_existing_456",
      stripeAccountStatus: "PENDING" as const,
    };

    const mockPrisma = {
      user: {
        update: vi.fn(),
      },
    };

    const context: CommandContext<typeof userWithStripe> = {
      commandName: "OnboardMe",
      prisma: mockPrisma as unknown as PrismaClient,
      record: userWithStripe,
      session: {
        session: { expiresAt: new Date(), id: "s1" },
        user: { email: userWithStripe.email, id: userWithStripe.id },
      },
      version: "2026-08-28",
    };

    const result = await onboardMe(
      {
        refreshUrl: "https://custom.example.com/refresh",
        returnUrl: "https://custom.example.com/return",
      },
      context,
    );

    expect(result).toEqual({
      accountLinkUrl: "https://connect.stripe.com/setup/s/456",
      stripeAccountId: "acct_existing_456",
    });

    expect(mockStripeAccountsCreate).not.toHaveBeenCalled();
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
    expect(mockStripeAccountLinksCreate).toHaveBeenCalledWith({
      account: "acct_existing_456",
      refresh_url: "https://custom.example.com/refresh",
      return_url: "https://custom.example.com/return",
      type: "account_onboarding",
    });
  });
});

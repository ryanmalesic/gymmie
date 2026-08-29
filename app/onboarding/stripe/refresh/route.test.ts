import { beforeEach, describe, expect, test, vi } from "vitest";

const { mockCreateStripeAccountLinkAction, mockRedirect, mockRequireSession } =
  vi.hoisted(() => ({
    mockCreateStripeAccountLinkAction: vi.fn(),
    mockRedirect: vi.fn(() => {
      throw new Error("redirect");
    }),
    mockRequireSession: vi.fn(),
  }));

vi.mock("next/navigation", () => ({ redirect: mockRedirect }));
vi.mock("@/app/actions/users", () => ({
  createStripeAccountLinkAction: mockCreateStripeAccountLinkAction,
}));
vi.mock("@/lib/auth/session.server", () => ({
  requireSession: mockRequireSession,
}));

import { GET } from "@/app/onboarding/stripe/refresh/route";

describe("GET /onboarding/stripe/refresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireSession.mockResolvedValue({
      session: { expiresAt: new Date(), id: "s1" },
      user: { email: "u@example.com", id: "u1" },
    });
  });

  test("authenticates and redirects to a replacement account link", async () => {
    mockCreateStripeAccountLinkAction.mockResolvedValue({
      data: {
        accountLinkUrl: "https://connect.stripe.com/setup/s/replacement",
        stripeAccountId: "acct_existing",
      },
      success: true,
    });

    await expect(GET()).rejects.toThrow("redirect");

    expect(mockRequireSession).toHaveBeenCalledWith(
      "/onboarding/stripe/refresh",
    );
    expect(mockCreateStripeAccountLinkAction).toHaveBeenCalledWith({});
    expect(mockRedirect).toHaveBeenCalledWith(
      "https://connect.stripe.com/setup/s/replacement",
    );
  });

  test("preserves the refresh route as the sign-in callback when unauthenticated", async () => {
    mockRequireSession.mockRejectedValue(new Error("redirect"));

    await expect(GET()).rejects.toThrow("redirect");

    expect(mockRequireSession).toHaveBeenCalledWith(
      "/onboarding/stripe/refresh",
    );
    expect(mockCreateStripeAccountLinkAction).not.toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();
  });
  test("returns to the dashboard when a replacement link cannot be created", async () => {
    mockCreateStripeAccountLinkAction.mockResolvedValue({
      code: "INTERNAL_ERROR",
      error: "Unable to create Stripe account link.",
      success: false,
    });

    await expect(GET()).rejects.toThrow("redirect");

    expect(mockRedirect).toHaveBeenCalledWith(
      "/dashboard?stripeAccountLinkError=1",
    );
  });
});

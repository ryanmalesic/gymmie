import { beforeEach, describe, expect, test, vi } from "vitest";

import { mapStripeAccountStatus, POST } from "@/app/api/webhooks/stripe/route";
import { getPrisma } from "@/lib/db";
import { getStripe, stripeWebhookSecret } from "@/lib/stripe";

vi.mock("@/lib/db", () => ({
  getPrisma: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: vi.fn(),
  stripeWebhookSecret: vi.fn(),
}));

describe("mapStripeAccountStatus", () => {
  test("returns ACTIVATED when details_submitted, charges_enabled, and payouts_enabled are true", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const account: any = {
      charges_enabled: true,
      details_submitted: true,
      payouts_enabled: true,
      requirements: { past_due: [] },
    };
    expect(mapStripeAccountStatus(account)).toBe("ACTIVATED");
  });

  test("returns PENDING when details are not submitted or charges not yet enabled", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const account: any = {
      charges_enabled: false,
      details_submitted: false,
      payouts_enabled: false,
      requirements: { currently_due: ["individual.id_number"] },
    };
    expect(mapStripeAccountStatus(account)).toBe("PENDING");
  });

  test("returns RESTRICTED when requirements are past due", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const account: any = {
      charges_enabled: true,
      details_submitted: true,
      payouts_enabled: true,
      requirements: { past_due: ["individual.verification.document"] },
    };
    expect(mapStripeAccountStatus(account)).toBe("RESTRICTED");
  });

  test("returns DISABLED when disabled_reason is rejected or listed", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const account: any = {
      requirements: { disabled_reason: "rejected.fraud" },
    };
    expect(mapStripeAccountStatus(account)).toBe("DISABLED");
  });
});

describe("Stripe Webhook POST route", () => {
  const mockConstructEventAsync = vi.fn();
  const mockUserUpdate = vi.fn();
  const mockUserUpdateMany = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(stripeWebhookSecret).mockReturnValue("whsec_test_secret");
    vi.mocked(getStripe).mockReturnValue({
      webhooks: {
        constructEventAsync: mockConstructEventAsync,
      },
    } as unknown as ReturnType<typeof getStripe>);
    vi.mocked(getPrisma).mockReturnValue({
      user: {
        update: mockUserUpdate,
        updateMany: mockUserUpdateMany,
      },
    } as unknown as ReturnType<typeof getPrisma>);
  });

  test("returns 400 if stripe-signature header is missing", async () => {
    const req = new Request("https://example.com/api/webhooks/stripe", {
      body: JSON.stringify({}),
      headers: {},
      method: "POST",
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Missing stripe-signature header");
  });

  test("returns 400 if signature verification fails", async () => {
    mockConstructEventAsync.mockRejectedValue(new Error("Invalid signature"));

    const req = new Request("https://example.com/api/webhooks/stripe", {
      body: "raw-payload",
      headers: { "stripe-signature": "invalid_sig" },
      method: "POST",
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid signature");
  });

  test("updates user by curried metadata.userId on account.updated event", async () => {
    mockConstructEventAsync.mockResolvedValue({
      data: {
        object: {
          charges_enabled: true,
          details_submitted: true,
          id: "acct_stripe_999",
          metadata: { userId: "usr_curried_123" },
          payouts_enabled: true,
          requirements: {},
        },
      },
      type: "account.updated",
    });

    const req = new Request("https://example.com/api/webhooks/stripe", {
      body: "payload",
      headers: { "stripe-signature": "valid_sig" },
      method: "POST",
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ received: true });

    expect(mockUserUpdate).toHaveBeenCalledWith({
      data: {
        stripeAccountId: "acct_stripe_999",
        stripeAccountStatus: "ACTIVATED",
      },
      where: { id: "usr_curried_123" },
    });
  });

  test("updates user by stripeAccountId if metadata.userId is not present", async () => {
    mockConstructEventAsync.mockResolvedValue({
      data: {
        object: {
          charges_enabled: false,
          details_submitted: false,
          id: "acct_stripe_888",
          metadata: {},
          payouts_enabled: false,
          requirements: {},
        },
      },
      type: "account.updated",
    });

    const req = new Request("https://example.com/api/webhooks/stripe", {
      body: "payload",
      headers: { "stripe-signature": "valid_sig" },
      method: "POST",
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    expect(mockUserUpdateMany).toHaveBeenCalledWith({
      data: {
        stripeAccountStatus: "PENDING",
      },
      where: { stripeAccountId: "acct_stripe_888" },
    });
  });
});

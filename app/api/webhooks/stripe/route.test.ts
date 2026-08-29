import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  mapStripeAccountStatus,
  mapStripeV2AccountStatus,
  POST,
} from "@/app/api/webhooks/stripe/route";
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

describe("mapStripeV2AccountStatus", () => {
  test("returns ACTIVATED when merchant and recipient capabilities are active", () => {
    expect(
      mapStripeV2AccountStatus({
        configuration: {
          merchant: {
            capabilities: {
              card_payments: { status: "active" },
              stripe_balance: { payouts: { status: "active" } },
              us_bank_account_ach_payments: { status: "active" },
            },
          },
          recipient: {
            capabilities: {
              stripe_balance: {
                stripe_transfers: { status: "active" },
              },
            },
          },
        },
        requirements: { entries: [] },
      }),
    ).toBe("ACTIVATED");
  });

  test("returns PENDING when active capabilities still have due requirements", () => {
    expect(
      mapStripeV2AccountStatus({
        configuration: {
          merchant: {
            capabilities: {
              card_payments: { status: "active" },
              stripe_balance: { payouts: { status: "active" } },
              us_bank_account_ach_payments: { status: "active" },
            },
          },
          recipient: {
            capabilities: {
              stripe_balance: {
                stripe_transfers: { status: "active" },
              },
            },
          },
        },
        requirements: {
          entries: [
            { state: "currently_due" },
            { state: "eventually_due" },
            { state: "pending_verification" },
          ],
        },
      }),
    ).toBe("PENDING");
  });

  test("returns DISABLED when a v2 capability is rejected despite due requirements", () => {
    expect(
      mapStripeV2AccountStatus({
        configuration: {
          merchant: {
            capabilities: {
              card_payments: { status: "rejected" },
            },
          },
          recipient: {
            capabilities: {
              stripe_balance: {
                stripe_transfers: { status: "active" },
              },
            },
          },
        },
        requirements: {
          entries: [{ state: "currently_due" }],
        },
      }),
    ).toBe("DISABLED");
  });

  test("returns RESTRICTED when a v2 requirement is past due", () => {
    expect(
      mapStripeV2AccountStatus({
        configuration: {
          merchant: {
            capabilities: { card_payments: { status: "active" } },
          },
          recipient: {
            capabilities: {
              stripe_balance: {
                stripe_transfers: { status: "active" },
              },
            },
          },
        },
        requirements: {
          entries: [{ state: "past_due" }],
        },
      }),
    ).toBe("RESTRICTED");
  });

  test("returns PENDING when capabilities are not complete", () => {
    expect(
      mapStripeV2AccountStatus({
        configuration: {
          merchant: {
            capabilities: { card_payments: { status: "pending" } },
          },
          recipient: {
            capabilities: {
              stripe_balance: {
                stripe_transfers: { status: "active" },
              },
            },
          },
        },
        requirements: { entries: [{ state: "currently_due" }] },
      }),
    ).toBe("PENDING");
  });
});

describe("Stripe Webhook POST route", () => {
  const mockConstructEventAsync = vi.fn();
  const mockParseEventNotificationAsync = vi.fn();
  const mockV2AccountRetrieve = vi.fn();
  const mockUserUpdate = vi.fn();
  const mockUserUpdateMany = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(stripeWebhookSecret).mockReturnValue("whsec_test_secret");
    vi.mocked(getStripe).mockReturnValue({
      v2: {
        core: {
          accounts: {
            retrieve: mockV2AccountRetrieve,
          },
        },
      },
      webhooks: {
        constructEventAsync: mockConstructEventAsync,
        parseEventNotificationAsync: mockParseEventNotificationAsync,
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

  test("updates user to ACTIVATED for a v2 account lifecycle event", async () => {
    mockConstructEventAsync.mockResolvedValue({
      data: {
        object: {
          configuration: {
            merchant: {
              capabilities: {
                card_payments: { status: "active" },
                stripe_balance: { payouts: { status: "active" } },
                us_bank_account_ach_payments: { status: "active" },
              },
            },
            recipient: {
              capabilities: {
                stripe_balance: {
                  stripe_transfers: { status: "active" },
                },
              },
            },
          },
          id: "acct_v2_activated",
          metadata: { userId: "usr_v2_activated" },
          requirements: { entries: [] },
        },
      },
      type: "v2.core.account.updated",
    });

    const req = new Request("https://example.com/api/webhooks/stripe", {
      body: "payload",
      headers: { "stripe-signature": "valid_sig" },
      method: "POST",
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockUserUpdate).toHaveBeenCalledWith({
      data: {
        stripeAccountId: "acct_v2_activated",
        stripeAccountStatus: "ACTIVATED",
      },
      where: { id: "usr_v2_activated" },
    });
  });

  test("resolves a reference-only v2 lifecycle event before persisting", async () => {
    mockV2AccountRetrieve.mockResolvedValue({
      configuration: {
        merchant: {
          capabilities: {
            card_payments: { status: "active" },
            stripe_balance: { payouts: { status: "active" } },
            us_bank_account_ach_payments: { status: "active" },
          },
        },
        recipient: {
          capabilities: {
            stripe_balance: {
              stripe_transfers: { status: "active" },
            },
          },
        },
      },
      id: "acct_v2_reference",
      metadata: { userId: "usr_v2_reference" },
      requirements: { entries: [] },
    });
    const thinNotification = JSON.stringify({
      created: "2026-08-29T04:21:08Z",
      id: "evt_v2_reference",
      livemode: false,
      object: "v2.core.event",
      related_object: {
        id: "acct_v2_reference",
        type: "v2.core.account",
        url: "/v2/core/accounts/acct_v2_reference",
      },
      type: "v2.core.account[configuration.merchant].capability_status_updated",
    });
    mockParseEventNotificationAsync.mockResolvedValue({
      created: "2026-08-29T04:21:08Z",
      id: "evt_v2_reference",
      livemode: false,
      object: "v2.core.event",
      related_object: {
        id: "acct_v2_reference",
        type: "v2.core.account",
        url: "/v2/core/accounts/acct_v2_reference",
      },
      type: "v2.core.account[configuration.merchant].capability_status_updated",
    });

    const req = new Request("https://example.com/api/webhooks/stripe", {
      body: thinNotification,
      headers: { "stripe-signature": "valid_sig" },
      method: "POST",
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockParseEventNotificationAsync).toHaveBeenCalledWith(
      thinNotification,
      "valid_sig",
      "whsec_test_secret",
    );
    expect(mockV2AccountRetrieve).toHaveBeenCalledWith("acct_v2_reference", {
      include: [
        "configuration.merchant",
        "configuration.recipient",
        "requirements",
      ],
    });
    expect(mockUserUpdate).toHaveBeenCalledWith({
      data: {
        stripeAccountId: "acct_v2_reference",
        stripeAccountStatus: "ACTIVATED",
      },
      where: { id: "usr_v2_reference" },
    });
  });

  test("returns 500 when a thin v2 lifecycle event cannot be retrieved", async () => {
    mockV2AccountRetrieve.mockRejectedValue(new Error("Stripe unavailable"));
    const thinNotification = JSON.stringify({
      created: "2026-08-29T04:21:08Z",
      id: "evt_v2_unavailable",
      livemode: false,
      object: "v2.core.event",
      related_object: {
        id: "acct_v2_unavailable",
        type: "v2.core.account",
        url: "/v2/core/accounts/acct_v2_unavailable",
      },
      type: "v2.core.account.updated",
    });
    mockParseEventNotificationAsync.mockResolvedValue({
      created: "2026-08-29T04:21:08Z",
      id: "evt_v2_unavailable",
      livemode: false,
      object: "v2.core.event",
      related_object: {
        id: "acct_v2_unavailable",
        type: "v2.core.account",
        url: "/v2/core/accounts/acct_v2_unavailable",
      },
      type: "v2.core.account.updated",
    });

    const req = new Request("https://example.com/api/webhooks/stripe", {
      body: thinNotification,
      headers: { "stripe-signature": "valid_sig" },
      method: "POST",
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      error: "Unable to retrieve Stripe v2 account",
    });
    expect(mockUserUpdate).not.toHaveBeenCalled();
    expect(mockUserUpdateMany).not.toHaveBeenCalled();
  });

  test("updates a v2 account to RESTRICTED when requirements are past due", async () => {
    mockConstructEventAsync.mockResolvedValue({
      data: {
        object: {
          configuration: {
            merchant: {
              capabilities: {
                card_payments: { status: "active" },
                stripe_balance: { payouts: { status: "active" } },
                us_bank_account_ach_payments: { status: "active" },
              },
            },
            recipient: {
              capabilities: {
                stripe_balance: {
                  stripe_transfers: { status: "active" },
                },
              },
            },
          },
          id: "acct_v2_restricted",
          metadata: {},
          requirements: { entries: [{ state: "past_due" }] },
        },
      },
      type: "v2.core.account.updated",
    });

    const req = new Request("https://example.com/api/webhooks/stripe", {
      body: "payload",
      headers: { "stripe-signature": "valid_sig" },
      method: "POST",
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockUserUpdateMany).toHaveBeenCalledWith({
      data: { stripeAccountStatus: "RESTRICTED" },
      where: { stripeAccountId: "acct_v2_restricted" },
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

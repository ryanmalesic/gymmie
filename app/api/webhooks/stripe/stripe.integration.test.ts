import { describe, expect, test, vi } from "vitest";

import { POST } from "@/app/api/webhooks/stripe/route";
import { getPrisma } from "@/lib/db";

const mockConstructEventAsync = vi.fn();

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    webhooks: {
      constructEventAsync: mockConstructEventAsync,
    },
  }),
  stripeSecretKey: () => "sk_test_integration_key",
  stripeWebhookSecret: () => "whsec_integration_secret",
}));

describe("Stripe Webhook integration against database", () => {
  test("processes account.updated webhook and updates user state in database via curried userId", async () => {
    const prisma = getPrisma();
    const user = await prisma.user.create({
      data: {
        addressLine1: "123 Main St",
        city: "San Francisco",
        country: "US",
        email: `webhook-user-${crypto.randomUUID()}@example.com`,
        latitude: 37.7749,
        longitude: -122.4194,
        name: "Webhook User",
        phone: "+1 (415) 555-1234",
        postalCode: "94107",
        state: "CA",
        timezone: "America/New_York",
      },
    });

    mockConstructEventAsync.mockResolvedValue({
      data: {
        object: {
          charges_enabled: true,
          details_submitted: true,
          id: "acct_stripe_live_123",
          metadata: {
            userId: user.id,
          },
          payouts_enabled: true,
          requirements: {
            currently_due: [],
            past_due: [],
          },
        },
      },
      type: "account.updated",
    });

    const request = new Request("http://localhost:3000/api/webhooks/stripe", {
      body: JSON.stringify({ event: "account.updated" }),
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": "t=12345,v1=valid_mock_signature",
      },
      method: "POST",
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    expect(updatedUser?.stripeAccountId).toBe("acct_stripe_live_123");
    expect(updatedUser?.stripeAccountStatus).toBe("ACTIVATED");
  });

  test("updates account status when requirements become restricted", async () => {
    const prisma = getPrisma();
    const user = await prisma.user.create({
      data: {
        email: `webhook-restricted-${crypto.randomUUID()}@example.com`,
        name: "Restricted User",
        stripeAccountId: "acct_stripe_restricted_456",
        stripeAccountStatus: "ACTIVATED",
      },
    });

    mockConstructEventAsync.mockResolvedValue({
      data: {
        object: {
          charges_enabled: false,
          details_submitted: true,
          id: "acct_stripe_restricted_456",
          metadata: {
            userId: user.id,
          },
          payouts_enabled: false,
          requirements: {
            past_due: ["individual.verification.document"],
          },
        },
      },
      type: "account.updated",
    });

    const request = new Request("http://localhost:3000/api/webhooks/stripe", {
      body: JSON.stringify({ event: "account.updated" }),
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": "t=12345,v1=valid_mock_signature",
      },
      method: "POST",
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    expect(updatedUser?.stripeAccountStatus).toBe("RESTRICTED");
  });
});

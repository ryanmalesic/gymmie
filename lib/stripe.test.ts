import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { getStripe, stripeSecretKey, stripeWebhookSecret } from "@/lib/stripe";

describe("stripe utilities", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  test("stripeSecretKey returns key if set", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    expect(stripeSecretKey()).toBe("sk_test_123");
  });

  test("stripeSecretKey throws if not set", () => {
    delete process.env.STRIPE_SECRET_KEY;
    expect(() => stripeSecretKey()).toThrow("STRIPE_SECRET_KEY is not set");
  });

  test("stripeWebhookSecret returns secret if set", () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_123";
    expect(stripeWebhookSecret()).toBe("whsec_123");
  });

  test("stripeWebhookSecret throws if not set", () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    expect(() => stripeWebhookSecret()).toThrow(
      "STRIPE_WEBHOOK_SECRET is not set",
    );
  });

  test("getStripe initializes Stripe client", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    const client = getStripe();
    expect(client).toBeDefined();
    expect(getStripe()).toBe(client);
  });
});

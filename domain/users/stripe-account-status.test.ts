import { describe, expect, test } from "vitest";

import { mapStripeV2AccountStatus } from "@/domain/users/stripe-account-status";

type Capability = { status: string };

type TestAccount = {
  [key: string]: unknown;
  configuration: {
    merchant: {
      capabilities: {
        [key: string]: unknown;
        card_payments: Capability;
        stripe_balance: { payouts: Capability };
        us_bank_account_ach_payments: Capability;
      };
    };
    recipient: {
      capabilities: {
        stripe_balance: { stripe_transfers: Capability };
      };
    };
  };
  requirements: { entries: unknown[] };
};

function accountWithRequiredCapabilities(
  overrides: Record<string, unknown> = {},
): TestAccount {
  return {
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
    ...overrides,
  } as TestAccount;
}

describe("mapStripeV2AccountStatus", () => {
  test("activates only when every required capability is active", () => {
    expect(mapStripeV2AccountStatus(accountWithRequiredCapabilities())).toBe(
      "ACTIVATED",
    );
  });

  test.each(["card_payments", "us_bank_account_ach_payments"])(
    "stays pending when merchant capability %s is missing",
    (capability) => {
      const account = accountWithRequiredCapabilities();
      const capabilities = account.configuration.merchant
        .capabilities as Record<string, undefined | unknown>;
      delete capabilities[capability];

      expect(mapStripeV2AccountStatus(account)).toBe("PENDING");
    },
  );

  test("stays pending when payouts is missing", () => {
    const account = accountWithRequiredCapabilities();
    const capabilities = account.configuration.merchant.capabilities as Record<
      string,
      undefined | unknown
    >;
    delete capabilities.stripe_balance;

    expect(mapStripeV2AccountStatus(account)).toBe("PENDING");
  });

  test("stays pending when transfers is missing", () => {
    const account = accountWithRequiredCapabilities();
    const capabilities = account.configuration.recipient.capabilities as Record<
      string,
      undefined | unknown
    >;
    delete capabilities.stripe_balance;

    expect(mapStripeV2AccountStatus(account)).toBe("PENDING");
  });

  test.each(["card_payments", "us_bank_account_ach_payments"])(
    "returns RESTRICTED when required merchant capability %s is restricted",
    (capability) => {
      const account = accountWithRequiredCapabilities();
      (account.configuration.merchant.capabilities as Record<string, unknown>)[
        capability
      ] = { status: "restricted" };

      expect(mapStripeV2AccountStatus(account)).toBe("RESTRICTED");
    },
  );

  test("returns RESTRICTED when payouts is restricted", () => {
    const account = accountWithRequiredCapabilities();
    account.configuration.merchant.capabilities.stripe_balance.payouts = {
      status: "restricted",
    };

    expect(mapStripeV2AccountStatus(account)).toBe("RESTRICTED");
  });

  test("returns RESTRICTED when transfers is restricted", () => {
    const account = accountWithRequiredCapabilities();
    account.configuration.recipient.capabilities.stripe_balance.stripe_transfers =
      { status: "restricted" };

    expect(mapStripeV2AccountStatus(account)).toBe("RESTRICTED");
  });

  test("returns DISABLED when a required capability is disabled", () => {
    const account = accountWithRequiredCapabilities();
    account.configuration.merchant.capabilities.card_payments = {
      status: "disabled",
    };

    expect(mapStripeV2AccountStatus(account)).toBe("DISABLED");
  });

  test("returns RESTRICTED for account-level past-due requirements", () => {
    expect(
      mapStripeV2AccountStatus(
        accountWithRequiredCapabilities({
          requirements: { entries: [{ state: "past_due" }] },
        }),
      ),
    ).toBe("RESTRICTED");
  });

  test("account-level disabled takes precedence over restricted requirements", () => {
    expect(
      mapStripeV2AccountStatus(
        accountWithRequiredCapabilities({
          requirements: { entries: [{ state: "past_due" }] },
          status: "disabled",
        }),
      ),
    ).toBe("DISABLED");
  });

  test("optional restricted capabilities do not prevent activation", () => {
    const account = accountWithRequiredCapabilities();
    account.configuration.merchant.capabilities.eps_payments = {
      status: "restricted",
    };

    expect(mapStripeV2AccountStatus(account)).toBe("ACTIVATED");
  });

  test("accepted and enabled are active capability states", () => {
    const account = accountWithRequiredCapabilities();
    account.configuration.merchant.capabilities.card_payments = {
      status: "accepted",
    };
    account.configuration.recipient.capabilities.stripe_balance.stripe_transfers =
      { status: "enabled" };

    expect(mapStripeV2AccountStatus(account)).toBe("ACTIVATED");
  });
});

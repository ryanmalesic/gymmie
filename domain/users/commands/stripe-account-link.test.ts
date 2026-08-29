import { afterEach, describe, expect, test } from "vitest";

import { getStripeAccountLinkUrls } from "@/domain/users/commands/stripe-account-link";

describe("getStripeAccountLinkUrls", () => {
  afterEach(() => {
    delete process.env.BETTER_AUTH_URL;
  });

  test("uses the configured application URL by default", () => {
    process.env.BETTER_AUTH_URL = "https://example.com/";

    expect(getStripeAccountLinkUrls({})).toEqual({
      refreshUrl: "https://example.com/onboarding/stripe/refresh",
      returnUrl: "https://example.com/onboarding/stripe/return",
    });
  });

  test("preserves explicitly provided URLs", () => {
    expect(
      getStripeAccountLinkUrls({
        refreshUrl: "https://custom.example.com/refresh",
        returnUrl: "https://custom.example.com/return",
      }),
    ).toEqual({
      refreshUrl: "https://custom.example.com/refresh",
      returnUrl: "https://custom.example.com/return",
    });
  });
});

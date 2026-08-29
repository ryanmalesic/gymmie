import "server-only";

export const STRIPE_ACCOUNT_REFRESH_PATH = "/onboarding/stripe/refresh";
export const STRIPE_ACCOUNT_RETURN_PATH = "/onboarding/stripe/return";

export interface StripeAccountLinkUrls {
  refreshUrl?: string;
  returnUrl?: string;
}

export function getStripeAccountLinkUrls(input: StripeAccountLinkUrls) {
  const defaultBaseUrl =
    process.env.BETTER_AUTH_URL?.replace(/\/$/, "") ?? "https://localhost:3000";

  return {
    refreshUrl:
      input.refreshUrl ?? `${defaultBaseUrl}${STRIPE_ACCOUNT_REFRESH_PATH}`,
    returnUrl:
      input.returnUrl ?? `${defaultBaseUrl}${STRIPE_ACCOUNT_RETURN_PATH}`,
  };
}

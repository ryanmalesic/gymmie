import "server-only";

import { getStripeAccountLinkUrls } from "@/domain/users/commands/stripe-account-link";
import { isProfileComplete } from "@/domain/users/gate";
import { defineCommand, type InferCommand } from "@/lib/commands/base";
import { getStripe } from "@/lib/stripe";
import { HttpsUrl, z } from "@/lib/zod";

// Stripe 22.6.0 declares this ACH capability as ach_debit_payments, but
// the Accounts v2 product contract requires us_bank_account_ach_payments.
type RequestedAccountConfiguration = {
  merchant: {
    capabilities: {
      card_payments: { requested: true };
      stripe_balance: { payouts: { requested: true } };
      us_bank_account_ach_payments: { requested: true };
    };
  };
  recipient: {
    capabilities: {
      stripe_balance: { stripe_transfers: { requested: true } };
    };
  };
};

const requestSchema = z
  .object({
    refreshUrl: HttpsUrl.optional(),
    returnUrl: HttpsUrl.optional(),
  })
  .strict()
  .openapi("OnboardMeRequest");

const responseSchema = z
  .object({
    accountLinkUrl: HttpsUrl,
    stripeAccountId: z
      .string()
      .openapi({ description: "Stripe Connected Account ID" }),
  })
  .strict()
  .openapi("OnboardMeResponse");

export const spec = defineCommand({
  load: {
    entity: "User",
    fetch: (user, _input, prisma) =>
      prisma.user.findUnique({ where: { id: user.id } }),
  },
  authorize: (user, _input, record) =>
    Boolean(user.id) && isProfileComplete(record),
  name: "OnboardMe",
  spec: {
    description:
      "Initiates Stripe Connect onboarding for an authenticated user with a complete profile. Returns an Account Link URL.",
    request: {
      description: "Optional custom refresh and return URLs",
      schema: requestSchema,
    },
    response: {
      description: "Generated Stripe account link and account ID",
      schema: responseSchema,
      status: 200,
    },
    summary: "Initiate Stripe Connect onboarding",
    tags: ["Users", "Stripe"],
  },
});

const onboardMe: InferCommand<typeof spec> = async (
  input,
  { prisma, record },
) => {
  const stripe = getStripe();
  let stripeAccountId = record.stripeAccountId;

  if (!stripeAccountId) {
    const account = await stripe.v2.core.accounts.create(
      {
        configuration: {
          merchant: {
            capabilities: {
              card_payments: { requested: true },
              stripe_balance: { payouts: { requested: true } },
              us_bank_account_ach_payments: { requested: true },
            },
          },
          recipient: {
            capabilities: {
              stripe_balance: {
                stripe_transfers: { requested: true },
              },
            },
          },
        } as unknown as RequestedAccountConfiguration,
        contact_email: record.email,
        dashboard: "express",
        defaults: {
          responsibilities: {
            fees_collector: "application",
            losses_collector: "application",
          },
        },
        identity: {
          country: (record.country ?? "US").toLowerCase(),
          entity_type: "individual",
        },
        metadata: {
          userId: record.id,
        },
      },
      {
        idempotencyKey: record.id,
      },
    );

    stripeAccountId = account.id;

    await prisma.user.update({
      data: {
        stripeAccountId: account.id,
        stripeAccountStatus: "PENDING",
      },
      where: { id: record.id },
    });
  }

  const { refreshUrl, returnUrl } = getStripeAccountLinkUrls(input);

  const accountLink = await stripe.v2.core.accountLinks.create({
    account: stripeAccountId,
    use_case: {
      account_onboarding: {
        configurations: ["merchant", "recipient"],
        refresh_url: refreshUrl,
        return_url: returnUrl,
      },
      type: "account_onboarding",
    },
  });

  return {
    accountLinkUrl: accountLink.url,
    stripeAccountId,
  };
};

export default onboardMe;

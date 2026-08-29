import "server-only";

import { isProfileComplete } from "@/domain/users/gate";
import { defineCommand, type InferCommand } from "@/lib/commands/base";
import { getStripe } from "@/lib/stripe";
import { HttpsUrl, z } from "@/lib/zod";

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
    const account = await stripe.accounts.create(
      {
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        country: record.country ?? "US",
        email: record.email,
        metadata: {
          userId: record.id,
        },
        type: "express",
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

  const defaultBaseUrl =
    process.env.BETTER_AUTH_URL?.replace(/\/$/, "") ?? "https://localhost:3000";
  const defaultReturnUrl = `${defaultBaseUrl}/onboarding/stripe/return`;
  const defaultRefreshUrl = `${defaultBaseUrl}/onboarding/stripe/refresh`;

  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: input.refreshUrl ?? defaultRefreshUrl,
    return_url: input.returnUrl ?? defaultReturnUrl,
    type: "account_onboarding",
  });

  return {
    accountLinkUrl: accountLink.url,
    stripeAccountId,
  };
};

export default onboardMe;

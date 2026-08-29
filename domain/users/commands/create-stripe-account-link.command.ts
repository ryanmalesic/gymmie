import "server-only";

import { getStripeAccountLinkUrls } from "@/domain/users/commands/stripe-account-link";
import { defineCommand, type InferCommand } from "@/lib/commands/base";
import { InternalError, NotFoundError } from "@/lib/commands/errors";
import { getStripe } from "@/lib/stripe";
import { HttpsUrl, z } from "@/lib/zod";

const requestSchema = z
  .object({})
  .strict()
  .openapi("CreateStripeAccountLinkRequest");

const responseSchema = z
  .object({
    accountLinkUrl: HttpsUrl,
    stripeAccountId: z.string(),
  })
  .strict()
  .openapi("CreateStripeAccountLinkResponse");

export const spec = defineCommand({
  load: {
    entity: "User",
    fetch: (user, _input, prisma) =>
      prisma.user.findUnique({ where: { id: user.id } }),
  },
  authorize: (user, _input, record) => record.id === user.id,
  name: "CreateStripeAccountLink",
  spec: {
    description:
      "Creates a fresh Stripe Account Link for an authenticated user's existing account.",
    request: {
      description: "Application-controlled Stripe onboarding callbacks",
      schema: requestSchema,
    },
    response: {
      description: "Fresh Stripe Account Link and account ID",
      schema: responseSchema,
      status: 200,
    },
    summary: "Create a Stripe Account Link",
    tags: ["Users", "Stripe"],
  },
});

const createStripeAccountLink: InferCommand<typeof spec> = async (
  _input,
  { record },
) => {
  if (!record.stripeAccountId) {
    throw new NotFoundError("Stripe account", record.id);
  }

  try {
    const accountLinks = (
      getStripe() as unknown as {
        v2?: {
          core?: {
            accountLinks?: {
              create: (params: unknown) => Promise<unknown>;
            };
          };
        };
      }
    ).v2?.core?.accountLinks;

    if (typeof accountLinks?.create !== "function") {
      throw new Error("Stripe v2 account links namespace is unavailable");
    }

    const { refreshUrl, returnUrl } = getStripeAccountLinkUrls({});
    const accountLink = await accountLinks.create({
      account: record.stripeAccountId,
      use_case: {
        account_onboarding: {
          configurations: ["merchant", "recipient"],
          refresh_url: refreshUrl,
          return_url: returnUrl,
        },
        type: "account_onboarding",
      },
    });

    if (
      !accountLink ||
      typeof accountLink !== "object" ||
      !("url" in accountLink) ||
      typeof accountLink.url !== "string" ||
      !accountLink.url.startsWith("https://")
    ) {
      throw new Error("Stripe did not return a secure account link");
    }

    return {
      accountLinkUrl: accountLink.url,
      stripeAccountId: record.stripeAccountId,
    };
  } catch {
    throw new InternalError("Unable to create Stripe account link.");
  }
};

export default createStripeAccountLink;

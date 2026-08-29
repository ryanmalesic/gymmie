import "server-only";
import Stripe from "stripe";

const globalForStripe = globalThis as { stripe?: Stripe };

export function getStripe(): Stripe {
  globalForStripe.stripe ??= new Stripe(stripeSecretKey(), {
    typescript: true,
  });
  return globalForStripe.stripe;
}

export function stripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return key;
}

export function stripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not set");
  }
  return secret;
}

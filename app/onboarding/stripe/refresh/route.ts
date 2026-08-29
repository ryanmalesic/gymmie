import { redirect } from "next/navigation";

import { createStripeAccountLinkAction } from "@/app/actions/users";
import { requireSession } from "@/lib/auth/session.server";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireSession("/onboarding/stripe/refresh");

  const result = await createStripeAccountLinkAction({});
  if (result.success) {
    redirect(result.data.accountLinkUrl);
  }

  redirect("/dashboard?stripeAccountLinkError=1");
}

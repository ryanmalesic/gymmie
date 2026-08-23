import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/get-session";
import { getSafeRequestCallbackUrl } from "@/lib/auth/request-target";

type AuthenticatedLayoutProps = {
  children: ReactNode;
};

export default async function AuthenticatedLayout({
  children,
}: AuthenticatedLayoutProps) {
  const session = await getSession();

  if (!session) {
    const callbackUrl = await getSafeRequestCallbackUrl();

    redirect(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return children;
}

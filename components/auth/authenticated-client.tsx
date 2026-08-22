"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";

const FRESH_AGE_MS = 10 * 60 * 1000;

export type AuthenticatedClientProps = {
  children: ReactNode;
  /**
   * When true, the session must have been created recently (within 10
   * minutes). If the session is stale the user is redirected to sign-in
   * with a `fresh=1` hint so the sign-in page can prompt
   * re-authentication.
   */
  forceFresh?: boolean;
  /**
   * URL to redirect to when the session is missing or stale.
   * Defaults to "/sign-in".
   */
  signInPath?: string;
};

/**
 * Client component that gates its children behind authentication.
 *
 * Uses better-auth's `useSession` hook for reactive session state.
 * Shows nothing while the session is loading, redirects when
 * unauthenticated or when `forceFresh` detects a stale session.
 */
export function AuthenticatedClient({
  children,
  forceFresh = false,
  signInPath = "/sign-in",
}: AuthenticatedClientProps) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [freshCheckDone, setFreshCheckDone] = useState(!forceFresh);
  const [isFreshValid, setIsFreshValid] = useState(true);

  useEffect(() => {
    if (!forceFresh || !session) {
      return;
    }

    async function checkFreshness() {
      const freshSession = await authClient.getSession({
        query: { disableCookieCache: true },
      });

      if (!freshSession.data) {
        setIsFreshValid(false);
      } else {
        const createdAt = new Date(
          freshSession.data.session.createdAt,
        ).getTime();
        setIsFreshValid(Date.now() - createdAt <= FRESH_AGE_MS);
      }

      setFreshCheckDone(true);
    }

    checkFreshness();
  }, [forceFresh, session]);

  const isStale = forceFresh && !isPending && freshCheckDone && !isFreshValid;

  const shouldRedirect = !isPending && (!session || isStale);

  useEffect(() => {
    if (!shouldRedirect) return;

    const params = new URLSearchParams();
    params.set("callbackUrl", window.location.pathname);

    if (forceFresh) {
      params.set("fresh", "1");
    }

    router.replace(`${signInPath}?${params.toString()}`);
  }, [shouldRedirect, forceFresh, signInPath, router]);

  if (isPending || !freshCheckDone || shouldRedirect) {
    return null;
  }

  return <>{children}</>;
}

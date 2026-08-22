import { redirect } from "next/navigation";
import { type ReactNode } from "react";

import {
  getSession,
  type GetSessionOptions,
  type SessionData,
} from "@/lib/auth/get-session";

export type AuthenticatedServerProps = GetSessionOptions & {
  children: ((session: SessionData) => ReactNode) | ReactNode;
  /**
   * URL to redirect to when the session is missing or stale.
   * Defaults to "/sign-in".
   */
  signInPath?: string;
};

/**
 * Server component that gates its children behind authentication.
 *
 * When `forceFresh` is true the session must have been created recently
 * (within 10 minutes). If the session is missing or stale, the user is
 * redirected to the sign-in page with a `callbackUrl` and, when
 * forceFresh was the reason, a `fresh=1` hint so the sign-in page can
 * prompt re-authentication rather than a simple login.
 */
export async function AuthenticatedServer({
  children,
  forceFresh = false,
  signInPath = "/sign-in",
}: AuthenticatedServerProps) {
  const session = await getSession({ forceFresh });

  if (!session) {
    const params = new URLSearchParams();
    params.set("callbackUrl", "/");

    if (forceFresh) {
      params.set("fresh", "1");
    }

    redirect(`${signInPath}?${params.toString()}`);
  }

  return <>{typeof children === "function" ? children(session) : children}</>;
}

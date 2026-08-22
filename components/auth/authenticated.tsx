import { type ReactNode } from "react";

import {
  AuthenticatedClient,
  type AuthenticatedClientProps,
} from "@/components/auth/authenticated-client";
import {
  AuthenticatedServer,
  type AuthenticatedServerProps,
} from "@/components/auth/authenticated-server";
import { type SessionData } from "@/lib/auth/get-session";

export type AuthenticatedProps = {
  children: ReactNode;
  /**
   * When true, the session must have been created recently (within 10
   * minutes). Both the server and client layers enforce this constraint.
   * Use for sensitive actions like account deletion that require
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
 * Composed auth gate that layers server-side and client-side protection.
 *
 * 1. **Server layer** (`AuthenticatedServer`): validates the session
 *    during SSR/RSC rendering. Redirects immediately on the server if
 *    the user is unauthenticated or the session is stale (when
 *    `forceFresh` is set).
 *
 * 2. **Client layer** (`AuthenticatedClient`): provides a reactive
 *    client-side guard. Catches cases where the session expires or
 *    becomes stale after the initial server render (e.g. long-lived
 *    tabs, SPA navigations).
 *
 * Usage:
 * ```tsx
 * <Authenticated>
 *   <ProtectedContent />
 * </Authenticated>
 *
 * // For sensitive actions requiring re-auth:
 * <Authenticated forceFresh>
 *   <DangerZone />
 * </Authenticated>
 * ```
 */
export function Authenticated({
  children,
  forceFresh = false,
  signInPath = "/sign-in",
}: AuthenticatedProps) {
  return (
    <AuthenticatedServer forceFresh={forceFresh} signInPath={signInPath}>
      <AuthenticatedClient forceFresh={forceFresh} signInPath={signInPath}>
        {children}
      </AuthenticatedClient>
    </AuthenticatedServer>
  );
}

export {
  AuthenticatedClient,
  type AuthenticatedClientProps,
  AuthenticatedServer,
  type AuthenticatedServerProps,
  type SessionData,
};

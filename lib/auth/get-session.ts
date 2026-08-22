import { headers } from "next/headers";

import { auth } from "@/lib/auth";

export type GetSessionOptions = {
  /**
   * When true, bypasses the cookie cache and fetches the session directly
   * from the database. Additionally checks that the session was created
   * recently (within the configured `freshAge`). Use this for sensitive
   * operations like account deletion that require re-authentication.
   */
  forceFresh?: boolean;
};

export type SessionData = typeof auth.$Infer.Session;

/**
 * Retrieve the current session on the server (RSC / server action).
 * Returns `null` when there is no valid session or when `forceFresh`
 * is requested but the session is stale.
 */
export async function getSession(
  options: GetSessionOptions = {},
): Promise<null | SessionData> {
  const { forceFresh = false } = options;

  const session = await auth.api.getSession({
    headers: await headers(),
    query: {
      disableCookieCache: forceFresh,
    },
  });

  if (!session) {
    return null;
  }

  if (forceFresh) {
    const freshAge = getFreshAge();
    const createdAt = new Date(session.session.createdAt).getTime();
    const now = Date.now();

    if (now - createdAt > freshAge * 1000) {
      return null;
    }
  }

  return session;
}

/**
 * Returns the configured freshAge in seconds.
 * Defaults to 10 minutes for forceFresh checks — stricter than
 * better-auth's default of 1 day, since forceFresh is intended for
 * high-sensitivity actions.
 */
function getFreshAge(): number {
  return 10 * 60;
}

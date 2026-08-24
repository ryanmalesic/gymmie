import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { auth, type Session } from "@/lib/auth";
import {
  CALLBACK_PATH_HEADER,
  DEFAULT_CALLBACK_PATH,
  getSafeCallbackPath,
  requestPath,
} from "@/lib/auth/session";

type RequestHeaders = Awaited<ReturnType<typeof headers>>;

export async function getSession(): Promise<null | Session> {
  return getCachedSession();
}

export async function requireSession(callbackPath?: string): Promise<Session> {
  const requestHeaders = await headers();
  const session = await getCachedSession();

  if (session) {
    return session;
  }

  const callbackUrl = getSafeCallbackPath(
    callbackPath ?? getRequestCallbackUrl(requestHeaders),
    DEFAULT_CALLBACK_PATH,
  );

  return redirectToSignIn(callbackUrl);
}

function getRequestCallbackUrl(
  requestHeaders: RequestHeaders,
): string | undefined {
  const requestUrl =
    requestHeaders.get(CALLBACK_PATH_HEADER) ??
    requestHeaders.get("next-url") ??
    requestHeaders.get("referer");

  if (!requestUrl) {
    return undefined;
  }

  return requestPath(requestUrl);
}

const getCachedSession = cache(async (): Promise<null | Session> => {
  return auth.api.getSession({ headers: await headers() });
});

function redirectToSignIn(callbackUrl: string): never {
  return redirect(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
}

"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { type AuthSession, getOrCreateAuth } from "@/lib/auth/server";
import {
  DEFAULT_CALLBACK_PATH,
  getSafeCallbackPath,
} from "@/lib/auth/session.client";

export type SessionData = AuthSession;

type RequestHeaders = Awaited<ReturnType<typeof headers>>;

export async function getSession(): Promise<null | SessionData> {
  return getSessionFromHeaders(await headers());
}

export async function requireSession(): Promise<SessionData> {
  const requestHeaders = await headers();
  const session = await getSessionFromHeaders(requestHeaders);

  if (session) {
    return session;
  }

  const callbackUrl = getSafeCallbackPath(
    getRequestCallbackUrl(requestHeaders),
    DEFAULT_CALLBACK_PATH,
  );

  return redirectToSignIn(callbackUrl);
}

function getRequestCallbackUrl(
  requestHeaders: RequestHeaders,
): string | undefined {
  const requestUrl =
    requestHeaders.get("referer") ?? requestHeaders.get("next-url");

  if (!requestUrl) {
    return undefined;
  }

  try {
    const url = new URL(requestUrl, "https://gymmie.internal");
    return `${url.pathname}${url.search}`;
  } catch {
    return undefined;
  }
}
function getSessionFromHeaders(
  requestHeaders: RequestHeaders,
): Promise<null | SessionData> {
  return getOrCreateAuth().api.getSession({ headers: requestHeaders });
}

function redirectToSignIn(callbackUrl: string): never {
  const sanitizedPath = callbackUrl.startsWith("/")
    ? callbackUrl.slice(1)
    : callbackUrl;
  return redirect(`/sign-in?callbackUrl=${encodeURIComponent(sanitizedPath)}`);
}

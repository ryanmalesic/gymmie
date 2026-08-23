import { headers } from "next/headers";

import {
  buildCallbackUrl,
  type SafeCallbackUrl,
} from "@/lib/auth/callback-url";
import { REQUEST_TARGET_HEADER } from "@/lib/auth/request-target-header";

const NEXT_URL_HEADER = "next-url";

type HeaderReader = Pick<Headers, "get">;

type RequestTargetParts = {
  pathname: string;
  queryString: string;
};

/**
 * Resolve the current request's safe callback URL on the server.
 *
 * Calling `headers()` makes this module server-only and keeps request metadata
 * access inside the server boundary used by the authenticated layout.
 */
export async function getSafeRequestCallbackUrl(): Promise<SafeCallbackUrl> {
  return getSafeRequestCallbackUrlFromHeaders(await headers());
}

/**
 * Read the safe callback target from Next's request metadata.
 *
 * The metadata-only proxy supplies `x-gymmie-request-target` for direct
 * document requests because Next does not expose their URL through the
 * Server Component `headers()` API. App Router client transitions may also
 * provide `next-url`, which remains a fallback for requests that bypass the
 * proxy (including focused unit tests).
 */
export function getSafeRequestCallbackUrlFromHeaders(
  requestHeaders: HeaderReader,
): SafeCallbackUrl {
  const requestTarget =
    requestHeaders.get(REQUEST_TARGET_HEADER) ??
    requestHeaders.get(NEXT_URL_HEADER);

  if (!requestTarget) {
    return "/";
  }

  const targetParts = splitRequestTarget(requestTarget);

  return targetParts
    ? buildCallbackUrl(targetParts.pathname, targetParts.queryString)
    : "/";
}

/**
 * Split an origin-relative request target without decoding or reserializing it.
 * The callback validator performs the complete safety check after the split.
 */
function splitRequestTarget(value: string): null | RequestTargetParts {
  if (!value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  const queryStart = value.indexOf("?");

  return queryStart === -1
    ? { pathname: value, queryString: "" }
    : {
        pathname: value.slice(0, queryStart),
        queryString: value.slice(queryStart),
      };
}

import { type NextRequest, NextResponse } from "next/server";

import { REQUEST_TARGET_HEADER } from "@/lib/auth/request-target-header";

/**
 * Forward the origin-relative request target to Server Components.
 *
 * Next's `headers()` API exposes request headers, but direct document requests
 * do not include the App Router's `next-url` header. This metadata-only proxy
 * preserves the target before the request enters the route layout; it makes
 * no authentication decision and never forwards the request origin or host.
 */
export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(
    REQUEST_TARGET_HEADER,
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/users/:path*"],
};

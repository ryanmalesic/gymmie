import { type NextRequest, NextResponse } from "next/server";

import { CALLBACK_PATH_HEADER } from "@/lib/auth/session";

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(
    CALLBACK_PATH_HEADER,
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};

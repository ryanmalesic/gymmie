import { headers } from "next/headers";
import { beforeEach, expect, test, vi } from "vitest";

import {
  getSafeRequestCallbackUrl,
  getSafeRequestCallbackUrlFromHeaders,
} from "@/lib/auth/request-target";
import { REQUEST_TARGET_HEADER } from "@/lib/auth/request-target-header";

vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test("preserves valid pathname and raw query metadata", () => {
  const requestHeaders = new Headers({
    "next-url": "/users?email=one%2Btwo&sort=name%20asc&sort=created",
  });

  expect(getSafeRequestCallbackUrlFromHeaders(requestHeaders)).toBe(
    "/users?email=one%2Btwo&sort=name%20asc&sort=created",
  );
});

test("preserves the proxy request target and its exact raw query", () => {
  const requestHeaders = new Headers({
    "next-url": "/users?tab=ignored",
    [REQUEST_TARGET_HEADER]: "/users?tab=members&filter=name%3Aalice",
  });

  expect(getSafeRequestCallbackUrlFromHeaders(requestHeaders)).toBe(
    "/users?tab=members&filter=name%3Aalice",
  );
});

test("does not fall back to transition metadata when proxy metadata is malformed", () => {
  const requestHeaders = new Headers({
    "next-url": "/users?tab=active",
    [REQUEST_TARGET_HEADER]: "/users/%ZZ",
  });

  expect(getSafeRequestCallbackUrlFromHeaders(requestHeaders)).toBe("/");
});

test.each([
  ["an empty target", ""],
  ["a target without a leading slash", "users?tab=active"],
  ["a target containing a fragment", "/users?tab=active#overview"],
  ["a target with a malformed escape", "/users/%ZZ"],
  ["a target containing a backslash", "/users\\settings"],
  ["a target containing a control character", "/users\u0000"],
])("returns the root fallback for %s", (_description, nextUrl) => {
  const requestHeaders = {
    get: (name: string) => (name === "next-url" ? nextUrl : null),
  };

  expect(getSafeRequestCallbackUrlFromHeaders(requestHeaders)).toBe("/");
});

test.each([
  "https://external.example/users?tab=active",
  "http://external.example/users",
  "//external.example/users",
])(
  "returns the root fallback for an absolute or external target: %s",
  (nextUrl) => {
    const requestHeaders = new Headers({ "next-url": nextUrl });

    expect(getSafeRequestCallbackUrlFromHeaders(requestHeaders)).toBe("/");
  },
);

test("does not derive a callback from referer or host headers", async () => {
  const requestHeaders = new Headers({
    host: "external.example",
    referer: "https://external.example/users?tab=active",
  });
  vi.mocked(headers).mockResolvedValue(requestHeaders);

  await expect(getSafeRequestCallbackUrl()).resolves.toBe("/");
  expect(headers).toHaveBeenCalledOnce();
});

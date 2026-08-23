import { headers } from "next/headers";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, expect, test, vi } from "vitest";

import { auth } from "@/lib/auth";
import { getSession } from "@/lib/auth/get-session";

vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

const sessionResolverSource = readFileSync(
  resolve(process.cwd(), "lib/auth/get-session.ts"),
  "utf8",
);

beforeEach(() => {
  vi.clearAllMocks();
});

test("resolves the current session with request headers and no freshness options", async () => {
  const requestHeaders = new Headers({ cookie: "session=test" });
  vi.mocked(headers).mockResolvedValue(requestHeaders);
  vi.mocked(auth.api.getSession).mockResolvedValue(null);

  await expect(getSession()).resolves.toBeNull();

  expect(auth.api.getSession).toHaveBeenCalledTimes(1);
  expect(auth.api.getSession).toHaveBeenCalledWith({
    headers: requestHeaders,
  });
});

test("propagates session resolver failures instead of creating a second auth decision", async () => {
  const resolverError = new Error("session service unavailable");
  vi.mocked(headers).mockResolvedValue(new Headers());
  vi.mocked(auth.api.getSession).mockRejectedValue(resolverError);

  await expect(getSession()).rejects.toBe(resolverError);
  expect(auth.api.getSession).toHaveBeenCalledTimes(1);
});

test("uses the standard session contract without freshness or age checks", () => {
  expect(sessionResolverSource).not.toMatch(
    /forceFresh|disableCookieCache|FRESH_AGE_MS|createdAt|session age/i,
  );
  expect(sessionResolverSource).toMatch(
    /auth\.api\.getSession\(\{[\s\S]*headers: await headers\(\),[\s\S]*\}\)/,
  );
});

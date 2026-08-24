import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Client } from "pg";
import { beforeEach, expect, test, vi } from "vitest";

import { CALLBACK_PATH_HEADER } from "@/lib/auth/session";
import { requireSession } from "@/lib/auth/session.server";
import { createTestSession } from "@/test/auth-helper";

vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

class RedirectedError extends Error {
  constructor(readonly destination: string) {
    super(`redirected to ${destination}`);
  }
}

beforeEach(() => {
  vi.mocked(redirect).mockImplementation((destination) => {
    throw new RedirectedError(destination);
  });
});

test("requireSession returns a database session for a valid cookie", async () => {
  const testSession = await createTestSession(process.env.DATABASE_URL!, {
    email: "dashboard@example.com",
    name: "Dashboard User",
  });

  vi.mocked(headers).mockResolvedValue(
    new Headers({ cookie: testSession.cookie }),
  );

  await expect(requireSession()).resolves.toMatchObject({
    user: {
      email: "dashboard@example.com",
      id: testSession.userId,
      name: "Dashboard User",
    },
  });
  expect(redirect).not.toHaveBeenCalled();
});

test("requireSession redirects missing cookies from the dashboard", async () => {
  vi.mocked(headers).mockResolvedValue(
    new Headers({ [CALLBACK_PATH_HEADER]: "/dashboard" }),
  );

  await expect(requireSession()).rejects.toMatchObject({
    destination: "/sign-in?callbackUrl=%2Fdashboard",
  });
});

test("requireSession redirects missing cookies from users with the query string", async () => {
  vi.mocked(headers).mockResolvedValue(
    new Headers({
      [CALLBACK_PATH_HEADER]: "/users?tab=members&filter=name%3Aalice",
    }),
  );

  await expect(requireSession()).rejects.toMatchObject({
    destination:
      "/sign-in?callbackUrl=%2Fusers%3Ftab%3Dmembers%26filter%3Dname%253Aalice",
  });
});

test("requireSession redirects an expired session to sign-in", async () => {
  const testSession = await createTestSession(process.env.DATABASE_URL!, {
    email: "expired-dashboard@example.com",
    name: "Expired Dashboard User",
  });
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  await client.connect();
  try {
    await client.query(
      'UPDATE "session" SET "expiresAt" = $1 WHERE "token" = $2',
      [new Date(0), testSession.sessionToken],
    );
  } finally {
    await client.end();
  }

  vi.mocked(headers).mockResolvedValue(
    new Headers({
      [CALLBACK_PATH_HEADER]: "/users",
      cookie: testSession.cookie,
    }),
  );

  await expect(requireSession()).rejects.toMatchObject({
    destination: "/sign-in?callbackUrl=%2Fusers",
  });
});

test("requireSession sanitizes an unsafe callback path", async () => {
  vi.mocked(headers).mockResolvedValue(
    new Headers({ [CALLBACK_PATH_HEADER]: "https://evil.example//phish" }),
  );

  await expect(requireSession()).rejects.toMatchObject({
    destination: "/sign-in?callbackUrl=%2Fdashboard",
  });
});

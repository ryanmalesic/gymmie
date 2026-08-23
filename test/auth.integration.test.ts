import { Client } from "pg";
import { beforeEach, expect, test, vi } from "vitest";

import { GET } from "@/app/api/auth/[...all]/route";
import { auth } from "@/lib/auth";
import { createTestSession } from "@/test/auth-helper";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test("resolves a session inserted directly into the database", async () => {
  const testSession = await createTestSession(process.env.DATABASE_URL!, {
    email: "authenticated@example.com",
    name: "Authenticated User",
  });

  const session = await auth.api.getSession({
    headers: new Headers({ cookie: testSession.cookie }),
  });

  expect(session).toMatchObject({
    session: {
      token: testSession.sessionToken,
      userId: testSession.userId,
    },
    user: {
      email: "authenticated@example.com",
      id: testSession.userId,
      name: "Authenticated User",
    },
  });
});

test("keeps the auth API public when no session exists", async () => {
  const response = await GET(
    new Request("http://localhost:3000/api/auth/get-session"),
  );

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toBeNull();
});

test("returns the authenticated session through the auth API route", async () => {
  const testSession = await createTestSession(process.env.DATABASE_URL!, {
    email: "api-authenticated@example.com",
    name: "API Authenticated User",
  });

  const response = await GET(
    new Request("http://localhost:3000/api/auth/get-session", {
      headers: { cookie: testSession.cookie },
    }),
  );

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toMatchObject({
    session: {
      token: testSession.sessionToken,
      userId: testSession.userId,
    },
    user: {
      email: "api-authenticated@example.com",
      id: testSession.userId,
      name: "API Authenticated User",
    },
  });
});

test("treats an expired session as unauthenticated through the auth API route", async () => {
  const testSession = await createTestSession(process.env.DATABASE_URL!, {
    email: "expired@example.com",
    name: "Expired User",
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

  const response = await GET(
    new Request("http://localhost:3000/api/auth/get-session", {
      headers: { cookie: testSession.cookie },
    }),
  );

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toBeNull();
});

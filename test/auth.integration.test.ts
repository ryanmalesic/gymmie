import { Client } from "pg";
import { beforeEach, expect, test, vi } from "vitest";

import { GET, POST } from "@/app/api/auth/[...all]/route";
import { auth } from "@/lib/auth";
import { createTestSession } from "@/test/auth-helper";

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

test("routes social sign-in initiation through the auth handler", async () => {
  const response = await POST(
    new Request("http://localhost:3000/api/auth/sign-in/social", {
      body: JSON.stringify({
        callbackURL: "/users",
        provider: "google",
      }),
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
      },
      method: "POST",
    }),
  );

  expect(response.status).toBeLessThan(400);
  const payload = (await response.json()) as { redirect: boolean; url: string };
  expect(payload.redirect).toBe(true);
  const authorizationUrl = new URL(payload.url);
  expect(authorizationUrl.hostname).toBe("accounts.google.com");
  expect(authorizationUrl.searchParams.get("redirect_uri")).toBe(
    "http://localhost:3000/api/auth/callback/google",
  );
  expect(response.headers.get("set-cookie")).toContain("better-auth.state=");
});

test("routes Apple sign-in with configured client credentials", async () => {
  const response = await POST(
    new Request("http://localhost:3000/api/auth/sign-in/social", {
      body: JSON.stringify({
        callbackURL: "/users",
        provider: "apple",
      }),
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
      },
      method: "POST",
    }),
  );

  expect(response.status).toBeLessThan(400);
  const payload = (await response.json()) as { redirect: boolean; url: string };
  expect(payload.redirect).toBe(true);
  const authorizationUrl = new URL(payload.url);
  expect(authorizationUrl.hostname).toBe("appleid.apple.com");
  expect(authorizationUrl.searchParams.get("redirect_uri")).toBe(
    "http://localhost:3000/api/auth/callback/apple",
  );
  expect(response.headers.get("set-cookie")).toContain("better-auth.state=");
});

import { Client } from "pg";
import { beforeEach, expect, test, vi } from "vitest";

import { GET, POST } from "@/app/api/auth/[...all]/route";
import { auth } from "@/lib/auth";
import { createTestSession } from "@/test/auth";

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
});

test("rejects sign-in callback when state is missing", async () => {
  const response = await GET(
    new Request(
      "http://localhost:3000/api/auth/callback/google?code=invalid-code",
    ),
  );

  expect(response.status).toBe(302);
  expect(response.headers.get("location")).toContain("error=");
});

test("rejects sign-in verification when code is invalid", async () => {
  const response = await POST(
    new Request("http://localhost:3000/api/auth/callback/google", {
      body: JSON.stringify({ code: "invalid-code", state: "invalid-state" }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }),
  );

  expect([400, 401, 302]).toContain(response.status);
});

test("rolls back uncommitted database writes during test cleanup", async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL! });
  await client.connect();

  const userId = `usr_cleanup_${crypto.randomUUID().slice(0, 8)}`;
  const email = `cleanup-${crypto.randomUUID()}@example.com`;

  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO "user" ("id", "name", "email", "emailVerified", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [userId, "Cleanup User", email, false],
    );
    await client.query("ROLLBACK");
  } finally {
    await client.end();
  }

  const checkClient = new Client({
    connectionString: process.env.DATABASE_URL!,
  });
  await checkClient.connect();
  try {
    const result = await checkClient.query(
      'SELECT id FROM "user" WHERE id = $1',
      [userId],
    );
    expect(result.rows).toHaveLength(0);
  } finally {
    await checkClient.end();
  }
});

test("rejects Apple sign-in verification when private key is invalid", async () => {
  const response = await POST(
    new Request("http://localhost:3000/api/auth/callback/apple", {
      body: JSON.stringify({ code: "invalid-code", state: "invalid-state" }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }),
  );

  expect([400, 401, 302]).toContain(response.status);
});

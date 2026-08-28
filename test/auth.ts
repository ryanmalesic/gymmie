import { createHmac, randomUUID } from "node:crypto";
import { Client } from "pg";

export const sessionCookieName = "better-auth.session_token";

export interface TestSession {
  cookie: string;
  sessionToken: string;
  userId: string;
}

interface TestUserOverrides {
  email?: string;
  name?: string;
}

export async function createTestSession(
  connectionString: string,
  overrides: TestUserOverrides = {},
): Promise<TestSession> {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const email = overrides.email ?? `test-${randomUUID()}@example.com`;
    const name = overrides.name ?? "Test User";
    const sessionToken = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const user = await client.query<{ id: string }>(
      `INSERT INTO "user" ("name", "email", "emailVerified", "updatedAt")
       VALUES ($1, $2, true, NOW())
       RETURNING "id"`,
      [name, email],
    );
    const userId = user.rows[0]?.id;

    if (!userId) {
      throw new Error("Test user was not created");
    }

    await client.query(
      `INSERT INTO "session" ("token", "expiresAt", "userId", "updatedAt")
       VALUES ($1, $2, $3, NOW())`,
      [sessionToken, expiresAt, userId],
    );

    return {
      cookie: signedSessionCookie(sessionToken),
      sessionToken,
      userId,
    };
  } finally {
    await client.end();
  }
}

function signedSessionCookie(sessionToken: string): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is not set");
  }

  const signature = createHmac("sha256", secret)
    .update(sessionToken)
    .digest("base64");

  return `${sessionCookieName}=${encodeURIComponent(`${sessionToken}.${signature}`)}`;
}

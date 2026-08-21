import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const TEST_USER_ID = 'test_user_e2e_000001';
const TEST_USER_NAME = 'E2E Test User';
const TEST_USER_EMAIL = 'e2e-test@gymmie.local';
const TEST_SESSION_ID = 'test_sess_e2e_00001';
const TEST_SESSION_TOKEN = 'e2e-test-session-token-playwright';

const BETTER_AUTH_SECRET =
  process.env.BETTER_AUTH_SECRET ?? 'playwright-test-secret-with-at-least-32-characters';
const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/gymmie_test';

export default async function globalSetup(): Promise<void> {
  const pool = new pg.Pool({ connectionString: DATABASE_URL });

  try {
    const now = new Date().toISOString();
    const expiresAt = '2099-01-01T00:00:00.000Z';

    // clean up any leftover data from previous runs
    await pool.query('DELETE FROM "session" WHERE "userId" = $1', [TEST_USER_ID]);
    await pool.query('DELETE FROM "user" WHERE id = $1', [TEST_USER_ID]);

    // insert test user
    await pool.query(
      `INSERT INTO "user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [TEST_USER_ID, TEST_USER_NAME, TEST_USER_EMAIL, true, null, now, now]
    );

    // insert test session
    await pool.query(
      `INSERT INTO "session" (id, "expiresAt", token, "createdAt", "updatedAt", "ipAddress", "userAgent", "userId")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        TEST_SESSION_ID,
        expiresAt,
        TEST_SESSION_TOKEN,
        now,
        now,
        '127.0.0.1',
        'Playwright',
        TEST_USER_ID,
      ]
    );

    // sign the session token the same way better-auth does
    const signedToken = signCookie(TEST_SESSION_TOKEN, BETTER_AUTH_SECRET);

    // write storage state for playwright
    const authDir = path.join(__dirname, '.auth');
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    const storageState = {
      cookies: [
        {
          domain: 'localhost',
          expires: -1,
          httpOnly: true,
          name: 'better-auth.session_token',
          path: '/',
          sameSite: 'Lax' as const,
          secure: false,
          value: signedToken,
        },
      ],
      origins: [],
    };

    fs.writeFileSync(path.join(authDir, 'user.json'), JSON.stringify(storageState, null, 2));
  } finally {
    await pool.end();
  }
}

function signCookie(value: string, secret: string): string {
  const signature = crypto.createHmac('sha256', secret).update(value).digest('base64url');
  return `${value}.${signature}`;
}

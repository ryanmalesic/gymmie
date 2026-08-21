import { execFileSync } from 'node:child_process';
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

const E2E_PORT = 5556;

export default async function globalSetup(): Promise<void> {
  let databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    // start embedded-postgres for e2e tests
    const { default: EmbeddedPostgres } = await import('embedded-postgres');

    const databaseDir = path.join(process.cwd(), '.tmp', 'test-db-e2e');
    const socketDir = path.join(process.cwd(), '.tmp', 'pg-socket-e2e');

    // clean up from previous runs
    fs.rmSync(databaseDir, { force: true, recursive: true });
    fs.rmSync(socketDir, { force: true, recursive: true });

    const epg = new EmbeddedPostgres({
      createPostgresUser: true,
      databaseDir,
      password: 'postgres',
      persistent: false,
      port: E2E_PORT,
      postgresFlags: ['-c', `unix_socket_directories=${socketDir}`],
      user: 'postgres',
    });

    await epg.initialise();

    // create socket dir after initialise (postgres user now exists)
    fs.mkdirSync(socketDir, { recursive: true });
    execFileSync('chown', ['postgres:postgres', socketDir]);
    execFileSync('chmod', ['1777', socketDir]);

    await epg.start();
    await epg.createDatabase('gymmie_test');

    databaseUrl = `postgresql://postgres:postgres@localhost:${E2E_PORT}/gymmie_test`;

    // store for teardown
    (globalThis as Record<string, unknown>).__embeddedPgInstance = epg;
    (globalThis as Record<string, unknown>).__e2eDatabaseUrl = databaseUrl;

    // run migrations
    const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
    execFileSync(command, ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env, DATABASE_URL: databaseUrl, DIRECT_URL: databaseUrl },
      stdio: 'inherit',
    });

    // set DATABASE_URL for the webServer process
    process.env.DATABASE_URL = databaseUrl;
    process.env.DIRECT_URL = databaseUrl;
  }

  // seed test user and session
  const pool = new pg.Pool({ connectionString: databaseUrl });

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

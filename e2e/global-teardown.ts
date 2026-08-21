import pg from 'pg';

const TEST_USER_ID = 'test_user_e2e_000001';

export default async function globalTeardown(): Promise<void> {
  const databaseUrl =
    ((globalThis as Record<string, unknown>).__e2eDatabaseUrl as string | undefined) ??
    process.env.DATABASE_URL ??
    'postgresql://postgres:postgres@localhost:5556/gymmie_test';

  // clean up seeded data
  const pool = new pg.Pool({ connectionString: databaseUrl });

  try {
    await pool.query('DELETE FROM "session" WHERE "userId" = $1', [TEST_USER_ID]);
    await pool.query('DELETE FROM "user" WHERE id = $1', [TEST_USER_ID]);
  } catch {
    // database may already be gone if embedded-postgres stopped
  } finally {
    await pool.end();
  }

  // stop embedded-postgres if it was started by global-setup
  const embeddedPg = (globalThis as Record<string, unknown>).__embeddedPgInstance as
    undefined | { stop: () => Promise<void> };

  if (embeddedPg) {
    await embeddedPg.stop();
    (globalThis as Record<string, unknown>).__embeddedPgInstance = null;
  }
}

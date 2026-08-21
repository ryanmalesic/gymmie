import pg from 'pg';

const TEST_USER_ID = 'test_user_e2e_000001';

const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/gymmie_test';

export default async function globalTeardown(): Promise<void> {
  const pool = new pg.Pool({ connectionString: DATABASE_URL });

  try {
    await pool.query('DELETE FROM "session" WHERE "userId" = $1', [TEST_USER_ID]);
    await pool.query('DELETE FROM "user" WHERE id = $1', [TEST_USER_ID]);
  } finally {
    await pool.end();
  }
}

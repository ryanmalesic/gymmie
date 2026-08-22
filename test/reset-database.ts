import { Client } from "pg";

export async function resetDatabase() {
  assertCiIsSet();

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query(`
      DO $$
      DECLARE
        statements TEXT;
      BEGIN
        SELECT 'TRUNCATE TABLE ' || string_agg(format('%I.%I', schemaname, tablename), ', ')
          || ' RESTART IDENTITY CASCADE'
        INTO statements
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename <> '_prisma_migrations';

        IF statements IS NOT NULL THEN
          EXECUTE statements;
        END IF;
      END $$;
    `);
  } finally {
    await client.end();
  }
}

function assertCiIsSet() {
  if (!process.env.CI) {
    throw new Error("resetDatabase() can only run when CI is set.");
  }
}

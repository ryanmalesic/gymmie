import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

async function main() {
  let databaseUrl = process.env.TEST_DATABASE_URL;
  let stopDb = null;

  if (!databaseUrl) {
    // start embedded-postgres
    console.log('No TEST_DATABASE_URL provided. Starting embedded PostgreSQL...');
    const { default: EmbeddedPostgres } = await import('embedded-postgres');

    const port = 5555;
    const user = 'postgres';
    const password = 'postgres';
    const dbName = 'gymmie_test';
    const databaseDir = path.join(process.cwd(), '.tmp', 'test-db-integration');
    const socketDir = path.join(process.cwd(), '.tmp', 'pg-socket-integration');

    // clean up from previous runs
    fs.rmSync(databaseDir, { force: true, recursive: true });
    fs.rmSync(socketDir, { force: true, recursive: true });

    const pg = new EmbeddedPostgres({
      createPostgresUser: true,
      databaseDir,
      password,
      persistent: false,
      port,
      postgresFlags: [`-c`, `unix_socket_directories=${socketDir}`],
      user,
    });

    await pg.initialise();

    // create socket dir after initialise (postgres user now exists)
    fs.mkdirSync(socketDir, { recursive: true });
    execFileSync('chown', ['postgres:postgres', socketDir]);
    execFileSync('chmod', ['1777', socketDir]);

    await pg.start();
    await pg.createDatabase(dbName);

    databaseUrl = `postgresql://${user}:${password}@localhost:${port}/${dbName}`;
    stopDb = () => pg.stop();
    console.log(`Embedded PostgreSQL started on port ${port}.`);
  }

  const environment = {
    ...process.env,
    DATABASE_URL: databaseUrl,
    DIRECT_URL: databaseUrl,
    NODE_ENV: 'test',
    TEST_DATABASE_URL: databaseUrl,
  };

  try {
    execFileSync(command, ['exec', 'prisma', 'migrate', 'deploy'], {
      env: environment,
      stdio: 'inherit',
    });
    execFileSync(
      command,
      ['exec', 'vitest', '--config', 'vitest.integration.config.mts', '--run'],
      { env: environment, stdio: 'inherit' }
    );
  } finally {
    if (stopDb) {
      console.log('Stopping embedded PostgreSQL...');
      await stopDb();
      console.log('Embedded PostgreSQL stopped.');
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

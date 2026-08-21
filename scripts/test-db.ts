import EmbeddedPostgres from 'embedded-postgres';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_PORT = 5555;
const DEFAULT_USER = 'postgres';
const DEFAULT_PASSWORD = 'postgres';
const DEFAULT_DATABASE = 'gymmie_test';

export interface TestDatabase {
  databaseUrl: string;
  stop: () => Promise<void>;
}

let instance: EmbeddedPostgres | null = null;

export function getTestDatabaseUrl(port = DEFAULT_PORT): string {
  return `postgresql://${DEFAULT_USER}:${DEFAULT_PASSWORD}@localhost:${port}/${DEFAULT_DATABASE}`;
}

export async function startTestDatabase(port = DEFAULT_PORT): Promise<TestDatabase> {
  const databaseDir = path.join(process.cwd(), '.tmp', 'test-db');
  const socketDir = path.join(process.cwd(), '.tmp', 'pg-socket');
  const databaseUrl = getTestDatabaseUrl(port);

  // clean up from previous runs
  fs.rmSync(databaseDir, { force: true, recursive: true });
  fs.rmSync(socketDir, { force: true, recursive: true });

  const pg = new EmbeddedPostgres({
    createPostgresUser: true,
    databaseDir,
    password: DEFAULT_PASSWORD,
    persistent: false,
    port,
    postgresFlags: ['-c', `unix_socket_directories=${socketDir}`],
    user: DEFAULT_USER,
  });

  await pg.initialise();

  // create socket dir after initialise (postgres user now exists)
  fs.mkdirSync(socketDir, { recursive: true });
  execFileSync('chown', ['postgres:postgres', socketDir]);
  execFileSync('chmod', ['1777', socketDir]);

  await pg.start();
  await pg.createDatabase(DEFAULT_DATABASE);

  instance = pg;

  // run prisma migrate deploy
  const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  execFileSync(command, ['exec', 'prisma', 'migrate', 'deploy'], {
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      DIRECT_URL: databaseUrl,
    },
    stdio: 'inherit',
  });

  return {
    databaseUrl,
    stop: async () => {
      await pg.stop();
      instance = null;
    },
  };
}

export async function stopTestDatabase(): Promise<void> {
  if (instance) {
    await instance.stop();
    instance = null;
  }
}

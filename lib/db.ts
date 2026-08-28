import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { PrismaClient } from "@/lib/generated/prisma/client";

const globalForPrisma = globalThis as { prisma?: PrismaClient };

export function databaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return url;
}

export function getPrisma(): PrismaClient {
  globalForPrisma.prisma ??= createPrisma();
  return globalForPrisma.prisma;
}

function createPrisma(): PrismaClient {
  const pool = new Pool({
    connectionString: databaseUrl(),
    idleTimeoutMillis: 10000,
    max: 10,
  });

  pool.on("error", () => {
    // Ignore pool client errors on background idle reconnection
  });

  return new PrismaClient({
    adapter: new PrismaPg(pool),
  });
}

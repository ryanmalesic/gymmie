import "dotenv/config";
import { defineConfig, env } from "prisma/config";

const databaseUrl = env("DATABASE_URL");
const shadowDatabaseUrl = process.env.SHADOW_DATABASE_URL;

const config = defineConfig({
  datasource: {
    url: databaseUrl,
    ...(shadowDatabaseUrl && shadowDatabaseUrl !== databaseUrl
      ? { shadowDatabaseUrl }
      : {}),
  },
  migrations: {
    path: "prisma/migrations",
  },
  schema: "prisma/schema.prisma",
});

export default config;

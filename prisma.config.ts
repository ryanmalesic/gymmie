import "dotenv/config";
import { defineConfig, env } from "prisma/config";

const config = defineConfig({
  datasource: {
    shadowDatabaseUrl: env("SHADOW_DATABASE_URL"),
    url: env("DATABASE_URL"),
  },
  migrations: {
    path: "prisma/migrations",
  },
  schema: "prisma/schema.prisma",
});

export default config;

---
name: prisma-cli
description: Run Prisma ORM v7 CLI commands for schema generation, migrations, deployment, database inspection, and Prisma Studio.
---

# Prisma CLI v7 guidance

Use the repository scripts when they exist. Generate the client after schema or generator changes. Use `prisma migrate dev` only with a development database, `prisma migrate deploy` for committed production migrations, and never use destructive reset commands without explicit user approval.

Prisma 7 reads datasource configuration from `prisma.config.ts`; keep migration files under `prisma/migrations`. A custom SQL function or extension must be added to a reviewed migration before schema defaults call it.

When a schema uses `dbgenerated(...)`, review the generated SQL and preserve the database expression. Do not run `db pull` or an auto-generated migration that removes a required function/default.

Reference: https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/generating-prisma-client and https://www.prisma.io/docs/ai/tools/mcp-server

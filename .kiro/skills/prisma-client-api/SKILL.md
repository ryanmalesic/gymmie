---
name: prisma-client-api
description: Use Prisma ORM v7 Client correctly in TypeScript and Next.js, including generated clients, driver adapters, CRUD, transactions, extensions, and server-only boundaries.
---

# Prisma Client v7 guidance

Use the generated client from the schema’s explicit output directory. For PostgreSQL, construct `PrismaClient` with `PrismaPg` and a connection string; keep both imports in server-only modules. Use the project’s singleton pattern to avoid creating a client per hot reload.

Prefer typed Prisma operations, `$transaction` for related writes, and `$extends` only when the behavior is intentionally global. Database defaults should remain the source of truth for generated IDs; do not add application-side IDs that bypass a schema default.

In Next.js, never import the server client into browser components. Run `prisma generate` after schema changes and before the production build.

Reference: https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/generating-prisma-client

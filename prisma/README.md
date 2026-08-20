# Prisma database notes

The schema targets PostgreSQL through Prisma’s `postgresql` provider and works with PostgreSQL 18. Prisma 7 generates the TypeScript client into `lib/generated/prisma`; run `pnpm prisma:generate` after schema changes.

Every current model primary key uses a database default of `generate_id('<prefix>')`. Better Auth is configured with `advanced.database.generateId: false`, and the Prisma client extension removes manually supplied IDs before create operations so PostgreSQL remains the source of truth.

Current prefixes:

| Model          | Prefix |
| -------------- | ------ |
| `User`         | `usr`  |
| `Session`      | `ssn`  |
| `Account`      | `acct` |
| `Verification` | `vrf`  |

Future domain models should follow the project prefix convention. The requested examples are `usr`, `org`, `gym`, `cntrct`, `mmbr`, `pln`, `sbscrptn`, `invc`, `pss`, and `agrmnt`. Add each model’s `@default(dbgenerated("generate_id('<prefix>')"))` and its matching migration default.

Apply the committed migration to a PostgreSQL database with:

```bash
pnpm prisma:migrate:deploy
```

For local development, use `pnpm prisma:migrate:dev --name auth-and-ids` only against a development database. The migration must run before any table default calls `generate_id`.

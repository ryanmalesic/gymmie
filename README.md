# Gymmie

Gymmie is a Next.js fitness companion. The current application provides a public landing page, Google and Apple sign-in through Better Auth, and a protected account page that lists the signed-in user's linked accounts.

## Getting started

Install dependencies and start the development server:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project structure

- `app/` contains App Router pages and the Better Auth catch-all route.
- `components/auth/` contains authentication and account interactions.
- `components/home/` contains homepage-specific interactions.
- `components/ui/` contains reusable UI primitives.
- `lib/` contains Better Auth, Prisma, session, and shared utility modules.
- `prisma/` contains the PostgreSQL schema and committed migrations.

## Authentication and database setup

Gymmie uses Better Auth with Prisma 7, a generated TypeScript Prisma Client, and PostgreSQL. The auth schema persists users, linked provider accounts, sessions, and verification records. Session cache data uses encrypted JWE cookies, while protected server pages verify the session with `auth.api.getSession`.

1. Copy `.env.example` to `.env` and set `BETTER_AUTH_SECRET` to a high-entropy value of at least 32 characters.
2. Set `BETTER_AUTH_URL` to the public application origin. The browser auth client uses the current origin, so this is the only auth-origin setting to maintain. Set `DATABASE_URL` to the PostgreSQL runtime URL. Set `DIRECT_URL` as well when Prisma migrations must bypass a pooler.
3. Add Google OAuth credentials and register `${BETTER_AUTH_URL}/api/auth/callback/google` as the Google callback.
4. Add Apple Service ID, Team ID, Key ID, and private key credentials. Apple requires an HTTPS callback URL and does not accept localhost/non-TLS callbacks.
5. Generate the client and apply the committed PostgreSQL migration:

```bash
pnpm prisma:generate
pnpm prisma:migrate:deploy
```

The first migration creates `encode_base32_14(n)` and `generate_id(p_prefix)`. The database generates every current model ID as a prefixed, 14-character Crockford Base32 suffix. Better Auth's `advanced.database.generateId: false` and the Prisma create extension prevent application-side IDs from replacing those defaults.

The auth endpoints are mounted at `/api/auth/*`. `/sign-in` starts Google or Apple sign-in, and `/account` is server-protected. Use `pnpm prisma:studio` to inspect the database.

For local development only, use `pnpm prisma:migrate:dev --name auth-and-ids`. Do not run it against a production database.

## Verification

```bash
pnpm lint
pnpm test
pnpm exec tsc --noEmit
pnpm e2e
```

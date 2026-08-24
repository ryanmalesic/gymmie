# Gymmie

Track gym users. The public home page introduces the app; after signing in, `/users` lists people stored in Postgres and lets you add new ones.

## Getting started

Copy `.env.example` to `.env`. Both `DATABASE_URL` and `SHADOW_DATABASE_URL` are required.

```bash
just install
just dev
```

`just dev` starts local Postgres if needed, then the Next.js app at [http://localhost:3000](http://localhost:3000).

## Commands

```bash
just build             # production build
just lint              # lint and apply safe fixes
just format            # format the repository
just test              # unit + integration tests
just test-unit         # unit tests only
just test-integration  # integration tests against Postgres
just e2e               # Playwright
just check             # lint, format, and production build
```

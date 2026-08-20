---
name: better-auth-best-practices
description: Configure Better Auth server and client integrations, database adapters, OAuth providers, users, accounts, sessions, plugins, and environment variables. Use for Better Auth or betterauth work.
---

# Better Auth project guidance

Use the current Better Auth documentation at https://better-auth.com/docs and https://better-auth.com/llms.txt for API details. Prefer the framework-specific integration and keep server-only auth configuration out of client modules.

## Integration checklist

- Keep `BETTER_AUTH_SECRET` at least 32 characters and never expose it through a `NEXT_PUBLIC_` variable.
- Set `BETTER_AUTH_URL` to the exact public origin used for OAuth callbacks.
- Configure the database before relying on durable users, accounts, sessions, or verification records.
- Mount the framework handler at `/api/auth/*`.
- Use the framework client for browser operations and `auth.api.getSession` with forwarded request headers on the server.
- Re-run the Better Auth schema migration after adding a plugin that changes the schema.

## Session and security defaults

- Use a short-lived JWE cookie cache when session data must be encrypted in the browser: `session.cookieCache.strategy: "jwe"`.
- Treat the primary session cookie as server-validated state; a cookie-presence check is only an optimistic redirect.
- Protect every sensitive page and API route with a server-side session lookup.
- Keep CSRF and origin checks enabled, configure trusted origins explicitly, and use secure cookies in production.
- Review account linking policy before allowing providers with untrusted email claims.

## OAuth provider setup

- Google needs `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and a callback at `/api/auth/callback/google`.
- Apple needs a Service ID, Team ID, Key ID, and private key. Generate its client-secret JWT at runtime with `jose`; Apple client-secret JWTs must be rotated before their six-month maximum lifetime.
- Apple does not support localhost/non-HTTPS callback URLs, so use an HTTPS tunnel or deployed origin for local Apple testing.

## Useful API patterns

```ts
const session = await auth.api.getSession({ headers: await headers() });
const { data: accounts } = await authClient.listAccounts();
await authClient.signIn.social({ provider: 'google', callbackURL: '/account' });
```

Source references: https://better-auth.com/docs/ai-resources/skills, https://better-auth.com/docs/authentication/google, https://better-auth.com/docs/authentication/apple, https://better-auth.com/docs/concepts/session-management, https://better-auth.com/docs/concepts/users-accounts.

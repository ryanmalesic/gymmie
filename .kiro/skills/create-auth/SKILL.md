---
name: create-auth
description: Add or update Better Auth authentication in JavaScript or TypeScript applications, including OAuth providers, route handlers, protected pages, account management, and auth UI.
---

# Create Better Auth integrations

Before changing code, inspect the framework, package manager, existing database/ORM, auth libraries, environment conventions, and test setup. Use the project’s existing patterns rather than introducing a second persistence layer or auth boundary.

## Next.js App Router pattern

1. Create a server-only `lib/auth.ts` with `betterAuth` and the selected database adapter.
2. Create `app/api/auth/[...all]/route.ts` and export `GET` and `POST` from `toNextJsHandler(auth)`.
3. Create `lib/auth-client.ts` with `createAuthClient` from `better-auth/react` for client components.
4. Use `auth.api.getSession({ headers: await headers() })` in server pages, route handlers, and server actions.
5. Put forms and provider buttons in client components; keep secrets and database imports server-only.
6. Redirect unauthenticated users from protected pages and return `401` from protected APIs.

## OAuth configuration

Configure each provider with environment variables. Google uses its client ID and secret. Apple uses a Service ID, Team ID, Key ID, and private key to create a short-lived ES256 client-secret JWT with `jose`. Set the provider callback URLs in each provider dashboard and keep `BETTER_AUTH_URL` aligned with them.

## JWE and sessions

For encrypted session cache data, enable:

```ts
session: {
  cookieCache: {
    enabled: true,
    maxAge: 5 * 60,
    strategy: "jwe",
  },
}
```

A cached cookie must not replace a server-side session check for authorization. Use the Better Auth API to verify the session before reading or mutating user data. `listAccounts` exposes the user’s linked provider accounts.

## Finish the integration

- Provide `.env.example` with placeholders, never credentials.
- Document database migration and OAuth dashboard setup.
- Verify formatting, linting, type checking, unit tests, and a production build.
- Do not claim OAuth works until provider credentials and callback URLs are configured.

Documentation: https://better-auth.com/docs/integrations/next, https://better-auth.com/docs/authentication/google, https://better-auth.com/docs/authentication/apple, https://better-auth.com/docs/concepts/session-management.

# Design: Authenticated Route Layout Refactor

## Overview

This refactor groups the protected `/users` route under a shared route-group layout while keeping the root `QueryProvider` as the single application-wide provider boundary. The authenticated layout becomes the sole server-side session guard, using a safe callback URL that preserves valid path and query data. Duplicate auth wrappers, proxy-based checks, and freshness-only session handling are removed without changing public routes, auth API behavior, or existing users functionality.

## Architecture

This refactor moves the existing `/users` page into a Next.js 16 App Router route group and makes the group layout the single authoritative server-side authentication boundary. The route group is organizational only: `(authenticated)` is not part of the browser URL, so `/users` remains the public pathname.

The root layout remains the application-wide provider boundary. The authenticated layout performs one standard session lookup and redirects unauthenticated requests to `/sign-in` with a validated internal callback URL. The users page continues to hydrate the existing users query and expose the existing list/create behavior, but no longer renders an `Authenticated` wrapper.

The current `proxy.ts` is removed. Its cookie-presence redirect is an additional initial request authentication decision, can disagree with the authoritative session resolver when a cookie is stale, and currently loses the query string in the callback. The route-group layout supplies the required server-side protection without that duplicate boundary.

## Goals and non-goals

### Goals

- Group only the current `/users` route under `app/(authenticated)/`.
- Keep `/users`, `/`, `/sign-in`, and `/api/auth/*` at their existing URLs.
- Keep exactly one `QueryProvider` boundary in the root layout.
- Use one server-side `getSession()` call in the authenticated layout for the initial protected render.
- Preserve the users listing and user-creation actions and their existing result/error behavior.
- Preserve the configured Better Auth API and social sign-in flow.
- Remove `forceFresh`, session-age checks, freshness-only cache bypasses, `fresh` query handling, and the obsolete composed auth wrappers.

### Non-goals

- No new users descendant routes.
- No changes to the database schema, users repository, users actions, table, or form behavior beyond moving the route entry point.
- No account deletion or new business action.
- No client-side session guard for the initial protected render.
- No change to provider configuration or Better Auth session policy.

## Route tree

The resulting route tree is:

```text
app/
├── layout.tsx                         # document + one QueryProvider
├── page.tsx                           # /
├── sign-in/
│   └── page.tsx                       # /sign-in
├── (authenticated)/
│   ├── layout.tsx                     # shared server-side guard
│   └── users/
│       └── page.tsx                   # /users (group name hidden)
└── api/
    └── auth/
        └── [...all]/
            └── route.ts               # /api/auth/*
```

`app/(authenticated)/users/page.tsx` is the moved version of the current users route. The route group contains no other current application route and no new descendant route. Next.js uses the group layout for `/users`, while the browser and client navigation continue to use `/users`.

The public landing page, sign-in page, and authentication route handler are siblings outside the group and therefore cannot be redirected by the authenticated layout.

### Data and control flow

#### Unauthenticated `/users` request

1. The request enters the root layout and receives the single `QueryProvider` boundary.
2. The `(authenticated)` layout calls `getSession()` once.
3. `getSession()` uses standard Better Auth session retrieval with request headers.
4. If no valid session exists, the layout obtains the original `/users` path and exact query string, normalizes it with `buildCallbackUrl`, and redirects to `/sign-in?callbackUrl=...`.
5. The sign-in page is outside the protected group and renders without another session check.
6. The user selects a provider. The page validates the callback again and sends the safe value to `authClient.signIn.social`.
7. After successful provider authentication, Better Auth returns the user to the internal callback, normally `/users`.

#### Authenticated `/users` request

1. The root layout creates the one QueryProvider context.
2. The authenticated layout resolves the session once and returns its children.
3. The users page fetches the existing list and seeds the page query client.
4. `HydrationBoundary` supplies the server data to `UsersPage`.
5. Existing client query and mutation behavior continues under the root QueryProvider.

#### Public and API requests

Requests to `/`, `/sign-in`, and `/api/auth/*` never enter the authenticated layout. The landing page and sign-in page remain accessible without a session, while the auth route handler retains its existing Better Auth behavior.

## Data Models

The refactor does not introduce database schema or users-domain model changes. It preserves the existing users repository, actions, table, and form data, and changes only the route entry point and authentication boundaries.

### Session data

The server session resolver continues to expose the Better Auth-inferred session shape:

```ts
export type SessionData = typeof auth.$Infer.Session;
```

A missing session is represented as `null`; unexpected authentication-service failures remain errors rather than being converted into an unauthenticated result.

### Safe callback URL

`SafeCallbackUrl` is an origin-relative string containing the original internal pathname and optional exact query string. It is limited to 2048 characters, begins with exactly one `/`, excludes schemes, hosts, fragments, control characters, and backslashes, and preserves valid path/query bytes without decoding and reserializing them. Invalid or unprovable request targets use `/`.

## Components and Interfaces

### Root layout: `app/layout.tsx`

Keep the existing document structure and render exactly one `QueryProvider` around `children`:

```tsx
<html lang="en">
  <body>
    <QueryProvider>{children}</QueryProvider>
  </body>
</html>
```

The provider must remain outside the route group so the same `QueryClient` context is available to the landing page, sign-in page, and users route on initial loads and client-side navigation. The authenticated layout must not import or render `QueryProvider`.

### Authenticated layout: `app/(authenticated)/layout.tsx`

This is a server component and the only initial-render authentication guard for the group:

```tsx
export default async function AuthenticatedLayout({ children }) {
  const session = await getSession();

  if (!session) {
    const callbackUrl = await getSafeRequestCallbackUrl();
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return children;
}
```

The layout does not render a client wrapper, provider, loading placeholder, or second session check. `redirect()` is used from the server so unauthenticated protected requests do not render users content before navigation.

The layout obtains the original request target through a small server-only request-target adapter backed by Next request metadata (`headers()`). The adapter must use the deployment/runtime request-target metadata that preserves both pathname and raw query string; it must not use `referer`, a browser-only API, or a reconstructed URL that drops the query. The adapter returns an origin-relative target and passes it to the shared callback validator. The deployment contract is that the original path/query metadata is available to server components; if it is absent or malformed, the safe fallback is `/` rather than an unsafe or guessed absolute URL.

Because App Router layouts do not receive page `searchParams`, request-target extraction belongs in this server-only adapter rather than in `page.tsx`. The adapter is a narrow boundary that can be tested independently of the layout.

### Session resolver: `lib/auth/get-session.ts`

Retain the module as the standard server session resolver, but reduce its public contract to a no-argument operation:

```ts
export type SessionData = typeof auth.$Infer.Session;

export async function getSession(): Promise<SessionData | null> {
  return auth.api.getSession({
    headers: await headers(),
  });
}
```

The resolver must not accept or forward `forceFresh`, must not pass `disableCookieCache`, and must not inspect `createdAt` or compare session age. An unavailable session returns `null`; unexpected authentication-service errors propagate to the normal Next.js error boundary instead of being misclassified as an unauthenticated visitor.

### Callback URL module: `lib/auth/callback-url.ts`

Create a dependency-free, client/server-safe helper module for callback normalization. It should expose a small interface such as:

```ts
type SafeCallbackUrl = string;

function isSafeCallbackUrl(value: string): boolean;
function normalizeCallbackUrl(
  value: string | null | undefined,
): SafeCallbackUrl;
function buildCallbackUrl(
  pathname: string,
  queryString: string,
): SafeCallbackUrl;
```

The validator accepts only an origin-relative internal path with an optional raw query string. It must enforce all of the following before returning the value:

- length is at most 2048 characters;
- starts with exactly one `/` and never with `//`;
- contains no scheme, host, fragment, control character, or backslash;
- does not turn into an external origin when parsed against a fixed internal base URL;
- preserves the original path and query bytes for valid input rather than decoding and reserializing them.

`buildCallbackUrl` first combines the original pathname and exact query string. If the combined value is valid and within the limit, it is returned unchanged. If the request target cannot be proven safe or exceeds the limit, it returns `/`. This bounded fallback gives the security constraint precedence over forwarding an oversized or ambiguous user-controlled value.

`normalizeCallbackUrl` returns a valid value unchanged and maps missing, malformed, external, fragment-bearing, backslash-containing, control-containing, or oversized values to `/`.

### Sign-in page: `app/sign-in/page.tsx`

Keep the page client-side because it uses `useSearchParams` and `authClient.signIn.social`, but remove all freshness state and content. On each render:

```ts
const callbackUrl = normalizeCallbackUrl(searchParams.get("callbackUrl"));
```

Both configured providers receive the normalized callback value. A valid callback is passed unchanged. An invalid or missing value is never forwarded; the provider flow receives `/` as the post-sign-in destination. The `fresh` query parameter is not read, interpreted, displayed, or included in either provider call. Therefore requests with no `fresh`, `fresh=1`, `fresh=true`, `fresh=false`, an empty value, or any malformed value render identically.

The page continues to use the existing Google and Apple buttons and does not add a client-side authentication guard.

### Users route: `app/(authenticated)/users/page.tsx`

Move the current route implementation without the page-level `Authenticated` wrapper:

```tsx
export default async function UsersRoute() {
  const queryClient = makeQueryClient();
  const users = await fetchUsers();

  if (users.ok) {
    queryClient.setQueryData(userKeys.list(), users.data);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UsersPage listAction={fetchUsers} mutationAction={addUser} />
    </HydrationBoundary>
  );
}
```

The route remains dynamic as it is today. Authorization has already completed in the parent layout, so this page performs no `getSession()` call and imports no authentication wrapper. The existing query hydration, `fetchUsers`, `addUser`, form validation, list rendering, and server-action result handling remain unchanged.

### Auth API: `app/api/auth/[...all]/route.ts`

Keep the existing `toNextJsHandler(auth)` GET/POST handler unchanged. Its location outside `(authenticated)` preserves Better Auth's externally observable API behavior and prevents the group guard from intercepting sign-in, callback, session, and other supported `/api/auth/*` paths.

### Removed modules

Delete the duplicated authentication wrapper files:

- `components/auth/authenticated.tsx`
- `components/auth/authenticated-server.tsx`
- `components/auth/authenticated-client.tsx`

Delete `proxy.ts` rather than retaining its cookie check. It is not an optimization once the authoritative layout runs on every protected request: it makes an independent auth decision, cannot validate a session as precisely as `getSession()`, and currently constructs an incomplete callback from pathname only. No replacement proxy is needed for this feature.

Remove all freshness-only support from authentication modules and UI: `forceFresh` types/props, `FRESH_AGE_MS`, fresh-age helpers, session `createdAt` comparisons, `disableCookieCache` query options, `fresh=1` redirect generation, and `isFreshRequired` sign-in rendering. Keep `lib/auth-client.ts` because social sign-in still uses it; it is not an authentication guard.

## Error Handling

- **No session:** Treat a missing/invalid session as the normal unauthenticated branch and redirect from the authenticated layout.
- **Session resolver failure:** Propagate unexpected `auth.api.getSession` failures to Next's normal error handling. Do not redirect on infrastructure/database errors as if the user were logged out.
- **Missing request target metadata:** Use `/` as a safe callback fallback. Never use `referer`, a host-derived absolute URL, or an unvalidated request header.
- **Unsafe callback:** Normalize to `/`; never pass an external origin, protocol-relative URL, fragment, control character, backslash, or oversized value to Better Auth.
- **Query fidelity:** For valid targets, concatenate the original pathname and exact query string without `URLSearchParams` reserialization, which can change encoding or ordering.
- **Redirect encoding:** Encode the callback value only when embedding it in the sign-in redirect query string. The sign-in page decodes the query parameter through `useSearchParams` and validates the resulting value again.
- **Provider failure:** Preserve the existing `authClient.signIn.social` failure behavior; this refactor does not add a new error UI or alter Better Auth responses.
- **Users data/action failures:** Preserve current `ActionResult` handling from `fetchUsers` and `addUser`, including validation errors, duplicate-email errors, and data-preservation behavior.
- **No freshness semantics:** Session age and `fresh` values have no effect anywhere in the route, resolver, redirect, or sign-in UI.

## Correctness properties

_A correctness property is a behavior that should hold for every generated valid input. Static route and provider-boundary constraints are complemented by example-based and integration tests because they concern a finite source structure or external framework behavior rather than a useful randomized input space._

### Property 1: Protected route access and URL invariants

**For any** generated request to the exact `/users` route or to a valid descendant path under `/users/`, the route manifest SHALL resolve it through the authenticated route-group layout without exposing `(authenticated)` in the browser pathname; an unauthenticated session SHALL redirect to `/sign-in`, and an authenticated session SHALL render the requested protected content without a sign-in redirect.

**Validates: Requirements 1.1, 1.2, 1.3, 1.5, 2.1, 2.2, 4.1, 4.5**

The property test generates route/session combinations and uses a mocked session resolver for layout-level behavior. A route-manifest/source assertion verifies that the current group contains only `/users`; Playwright examples verify direct and client-side navigation preserve `/users`.

### Property 2: Callback safety, fidelity, and freshness absence

**For any** origin-relative request pathname and exact query string, callback construction SHALL return the original path plus query unchanged when it is safe and no longer than 2048 characters, otherwise SHALL return `/`; every returned value SHALL be an internal Safe Callback URL, and the generated sign-in redirect SHALL contain no `fresh` query parameter.

**Validates: Requirements 2.3, 2.4, 5.4**

The generator varies root and users paths, encoded characters, query ordering, empty queries, malformed host-like values, fragments, backslashes, controls, and oversized targets. Assertions check the length bound, one-leading-slash rule, absence of external-origin components, and exact raw-string fidelity for accepted targets.

### Property 3: Callback validation and provider propagation

**For any** callback candidate and configured social provider, the sign-in flow SHALL forward a valid Safe Callback URL unchanged, while a missing or invalid candidate SHALL never be forwarded and SHALL use `/` as the provider post-sign-in destination.

**Validates: Requirements 2.5, 2.6**

The test renders or invokes the callback-normalization boundary with a mocked `authClient.signIn.social`, generates valid and invalid candidate strings, and asserts the provider receives only the normalized safe value. The same property runs for Google and Apple.

### Property 4: Single provider boundary and route availability

**For any** generated route category among landing, sign-in, auth API, and authenticated users, and for either direct load or client navigation, the application SHALL expose exactly one QueryProvider boundary at the root for rendered application pages, and the route SHALL retain its expected context or public/protected availability without an authenticated layout provider.

**Validates: Requirements 3.1, 3.2, 3.3, 1.4, 6.1, 6.2, 6.3**

The provider count and placement are verified with source/component-structure tests. Representative Playwright and route-handler integration cases verify that landing/sign-in/auth API remain public and users UI still operates with query context.

### Property 5: One initial session decision and standard session contract

**For any** authenticated or unauthenticated initial request to a route in the authenticated group, the authenticated layout SHALL be the only initial-render authentication decision, SHALL call the standard session resolver once, and SHALL never pass freshness options or compare session age; the users page SHALL perform no separate auth check.

**Validates: Requirements 4.1, 4.2, 4.3, 4.5, 5.1, 5.2, 5.3**

A call-count test mocks `getSession()` and renders the layout/page boundary. Static type/source checks assert the removed wrapper modules and all `forceFresh`, age-check, and `disableCookieCache` references are absent. A separate integration example covers a later expired-session request using the existing session-expiration behavior.

## Testing Strategy

### Property-based tests

Use the repository's Vitest setup and a property-testing library available to the implementation (or a small deterministic generator if no library is introduced). Each property test must run at least 100 generated cases and include a comment/tag in the form:

```text
Feature: authenticated-route-layout-refactor, Property N: <property text>
```

Prioritize pure functions in `lib/auth/callback-url.ts` and mocked layout/sign-in boundaries for PBT. Do not use PBT to repeatedly exercise Postgres, Better Auth providers, or browser layout pixels.

### Example and structural tests

- Assert the route tree contains `app/(authenticated)/layout.tsx` and `app/(authenticated)/users/page.tsx`, with no current descendant route and no `Authenticated` import in the users page.
- Assert `RootLayout` contains one QueryProvider boundary and the authenticated layout contains none.
- Assert `getSession()` calls Better Auth with request headers only.
- Assert no auth module or prop contains `forceFresh`, `fresh`, `disableCookieCache`, freshness-age constants, or age comparisons.
- Render sign-in with absent and representative `fresh` values and assert identical UI/provider options.
- Preserve existing users action tests for valid creation, schema-invalid input, duplicate email, and returned value/error preservation.

### Integration and browser tests

- Request `/` without a session and with an expired session; assert the landing page remains accessible.
- Request `/sign-in` without a session and with an expired session; assert the sign-in page renders directly.
- Request `/users` without a session; assert a server redirect to `/sign-in` with a safe callback containing `/users` and its query when safe.
- Request `/users` with a valid session; assert the existing users listing renders.
- Exercise direct and client-side `/users` navigation; assert pathname remains `/users` and the users query/form work under the root provider.
- Exercise representative supported `/api/auth/*` requests and compare status/session behavior with the pre-refactor baseline.
- Exercise valid user creation and invalid/duplicate inputs through the existing action/UI path.

## Implementation sequence

1. Add the shared callback validator/request-target boundary and the authenticated route-group layout.
2. Move the users page into the route group and remove its page-level wrapper.
3. Simplify `getSession()` to the standard no-options contract.
4. Remove `proxy.ts`, the three obsolete auth wrapper modules, and all freshness support; update sign-in callback normalization.
5. Add/update structural, unit, integration, and browser tests from the traceability plan.
6. Run formatting, lint, typecheck/build, unit/integration tests, and the relevant Playwright coverage.

# Implementation Plan: Authenticated Route Layout Refactor

## Overview

Implement the refactor incrementally: establish safe callback and request-target primitives, simplify the server session contract, add the authenticated route-group layout, move `/users` beneath it, update sign-in callback handling, remove duplicate guards and freshness code, then wire structural, unit, property-based, integration, and browser coverage. Preserve the existing users listing/creation behavior, Better Auth route handler, public routes, provider configuration, and route URLs. Do not add account deletion or any unrelated business action.

Each implementation prompt below is intended for a code-generation LLM: it names the concrete files/components to change, builds on earlier work, and leaves the feature wired into the existing application rather than creating orphaned code.

## Tasks

- [x] 1. Establish safe request-target and callback foundations
  - [x] 1.1 Create `lib/auth/callback-url.ts` with the dependency-free `SafeCallbackUrl` validation, normalization, and request callback builder described in the design.
    - Preserve valid pathname/query bytes exactly; accept only internal origin-relative values with one leading slash, no `//`, scheme, host, fragment, control character, backslash, or length greater than 2048.
    - Normalize missing or unsafe values to `/`; make `buildCallbackUrl` combine pathname plus the exact raw query string and fall back to `/` when safety cannot be proven.
    - _Requirements: 2.3, 2.4, 2.6, 5.4_
    - _Affected files: `lib/auth/callback-url.ts`_

  - [x] 1.2 Create the server-only request-target adapter used by the authenticated layout.
    - Extract deployment-provided origin-relative pathname and raw query metadata without using `referer`, browser APIs, or a host-derived absolute URL.
    - Pass the extracted values through `buildCallbackUrl` and return `/` when metadata is absent or malformed.
    - _Requirements: 2.3, 2.4_
    - _Affected files: `lib/auth/request-target.ts`_

  - [x]* 1.3 Write unit and property-based tests for callback safety and fidelity.
    - **Property 2: Callback safety, fidelity, and freshness absence**
    - Generate at least 100 cases covering `/`, `/users`, encoded paths, exact query ordering/bytes, empty queries, host-like values, fragments, backslashes, controls, and oversized targets; assert valid raw-string preservation and `/` fallback for unsafe inputs.
    - Add the required test tag/comment: `Feature: authenticated-route-layout-refactor, Property 2: Callback safety, fidelity, and freshness absence`.
    - _Validates: Requirements 2.3, 2.4, 5.4_
    - _Affected files: `lib/auth/callback-url.test.ts`_

  - [x]* 1.4 Write unit tests for request-target extraction and safe fallback behavior.
    - Cover valid pathname/query metadata, missing metadata, malformed metadata, and the prohibition on using a referer or absolute external target.
    - _Requirements: 2.3, 2.4_
    - _Affected files: `lib/auth/request-target.test.ts`_

- [x] 2. Implement the root provider and authenticated route boundary
  - [x] 2.1 Simplify `getSession()` to the standard no-options server contract.
    - Remove `GetSessionOptions`, `forceFresh`, `disableCookieCache`, session-age helpers, `createdAt` comparisons, and freshness-specific comments/behavior.
    - Call `auth.api.getSession` with request headers only; return `null` for no session and allow unexpected resolver errors to propagate.
    - _Requirements: 4.3, 5.1, 5.2, 5.3_
    - _Affected files: `lib/auth/get-session.ts`_

  - [x] 2.2 Verify and adjust the root layout so it is the sole application-wide `QueryProvider` boundary.
    - Keep the existing document metadata and structure, wrap the complete `children` route tree with exactly one `QueryProvider`, and do not move the provider into the route group.
    - Ensure the implementation remains compatible with public routes, the sign-in page, and the moved users route on initial loads and client navigation.
    - _Requirements: 3.1, 3.3_
    - _Affected files: `app/layout.tsx`_

  - [x] 2.3 Create `app/(authenticated)/layout.tsx` as the only initial-render authentication guard.
    - Call the simplified `getSession()` exactly once; render children for an authenticated session and redirect unauthenticated requests to `/sign-in`.
    - Build the callback from the request-target adapter, encode it only for the sign-in redirect query, preserve the original safe path/query, and never add `fresh`.
    - Keep this as a server layout with no client guard, provider, loading wrapper, or second session lookup.
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 2.1–2.4, 4.1, 4.2, 4.5, 5.4_
    - _Affected files: `app/(authenticated)/layout.tsx`

  - [x] 2.4 Move the users route into the authenticated group without changing users behavior.
    - Move the existing route implementation from `app/users/page.tsx` to `app/(authenticated)/users/page.tsx` and preserve dynamic rendering, query hydration, `fetchUsers`, `addUser`, list rendering, validation, and mutation result handling.
    - Remove the page-level `Authenticated` import/wrapper; do not add a descendant route, account deletion, or any new users action.
    - _Requirements: 1.1–1.3, 1.5, 4.2, 6.4–6.6_
    - _Affected files: delete `app/users/page.tsx`; create `app/(authenticated)/users/page.tsx`

  - [x] 2.5 Update sign-in callback handling and remove freshness UI/state.
    - Normalize `searchParams.get("callbackUrl")` with `normalizeCallbackUrl`; pass the resulting safe value unchanged to both Google and Apple social sign-in calls, defaulting invalid/missing values to `/`.
    - Remove `fresh` query parsing, `isFreshRequired`, freshness-specific title/description branches, and any other freshness state while preserving the existing buttons and provider configuration.
    - _Requirements: 2.5, 2.6, 5.5, 6.2_
    - _Affected files: `app/sign-in/page.tsx`

  - [x]* 2.6 Write layout access and route-group property tests.
    - **Property 1: Protected route access and URL invariants**
    - Generate exact `/users` and valid present descendants with authenticated/unauthenticated session mocks; assert one layout decision, redirect to sign-in for no session, content for a valid session, and no `(authenticated)` URL segment.
    - Add the required test tag/comment: `Feature: authenticated-route-layout-refactor, Property 1: Protected route access and URL invariants`.
    - _Validates: Requirements 1.1–1.5, 2.1–2.2, 4.1, 4.5_
    - _Affected files: `app/(authenticated)/layout.test.tsx`

  - [x]* 2.7 Write sign-in callback propagation property tests.
    - **Property 3: Callback validation and provider propagation**
    - Generate valid and invalid/missing callback candidates and run the same assertions for Google and Apple: valid values are forwarded unchanged, invalid values are replaced with `/`, and no unsafe value reaches `authClient.signIn.social`.
    - Add the required test tag/comment: `Feature: authenticated-route-layout-refactor, Property 3: Callback validation and provider propagation`.
    - _Validates: Requirements 2.5–2.6_
    - _Affected files: `app/sign-in/page.test.tsx`

  - [x]* 2.8 Write provider-boundary and route-availability structural tests.
    - **Property 4: Single provider boundary and route availability**
    - Assert `app/layout.tsx` contains exactly one `QueryProvider` boundary around the route tree, the authenticated layout contains none, the group contains only the moved users route, and `/`, `/sign-in`, and `/api/auth/*` remain outside the group.
    - Add the required test tag/comment: `Feature: authenticated-route-layout-refactor, Property 4: Single provider boundary and route availability`.
    - _Validates: Requirements 1.3–1.4, 3.1–3.3, 6.1–6.3_
    - _Affected files: update `app/layout.test.tsx`; create `app/(authenticated)/route-structure.test.ts`

  - [x]* 2.9 Write the single-initial-authentication-guard property tests.
    - **Property 5: One initial session decision and standard session contract**
    - Mock `getSession()` and verify the group layout calls it once, the users page performs no separate auth check, authenticated content renders, and unauthenticated content redirects before rendering.
    - Assert the session call has no options and no freshness behavior; cover a later expired-session request through the existing request behavior without adding another initial-render guard.
    - Add the required test tag/comment: `Feature: authenticated-route-layout-refactor, Property 5: One initial session decision and standard session contract`.
    - _Validates: Requirements 4.1–4.5, 5.1–5.3_
    - _Affected files: `app/(authenticated)/layout.test.tsx`; `lib/auth/get-session.test.ts`

- [x] 3. Remove obsolete guards and freshness-only code
  - [x] 3.1 Delete the obsolete proxy and duplicated authentication wrapper modules after the route-group guard is wired.
    - Delete `proxy.ts`, `components/auth/authenticated.tsx`, `components/auth/authenticated-server.tsx`, and `components/auth/authenticated-client.tsx`.
    - Remove any remaining imports/references to those wrappers and verify no `forceFresh`, `fresh=1`, `isFreshRequired`, `disableCookieCache`, freshness-age constant, or session-age comparison remains in application auth/UI code.
    - Keep `lib/auth-client.ts` and the existing Better Auth configuration because social sign-in and the auth API remain in scope.
    - _Requirements: 4.1–4.5, 5.1–5.5, 6.3_
    - _Affected files: delete `proxy.ts`; delete `components/auth/authenticated.tsx`; delete `components/auth/authenticated-server.tsx`; delete `components/auth/authenticated-client.tsx`; update any remaining references found by search

  - [x]* 3.2 Add structural cleanup tests for removed guards, freshness controls, and preserved route placement.
    - Assert deleted modules are not imported, the users page has no page-level auth wrapper, `getSession()` has no options, no redirect contains `fresh`, the sign-in page does not read `fresh`, and the existing `app/api/auth/[...all]/route.ts` remains unchanged/outside the group.
    - _Requirements: 1.4, 4.2–4.5, 5.1–5.5, 6.3_
    - _Affected files: create `test/authenticated-route-structure.test.ts`

- [x] 4. Preserve public, auth API, and users behavior with automated coverage
  - [x]* 4.1 Extend unit/integration coverage for public routes, auth API, session resolution, and existing users operations.
    - Verify `/` and `/sign-in` remain accessible with no/expired sessions; supported `/api/auth/*` behavior remains unchanged; authenticated `/users` renders existing data; valid creation, schema-invalid input, duplicate email, and data/error preservation retain their baselines.
    - Reuse existing action tests and integration setup rather than changing repositories, schema, auth provider configuration, or business scope.
    - _Requirements: 2.1–2.2, 6.1–6.5_
    - _Affected files: update `test/auth.integration.test.ts`; update or extend `app/users/actions.test.ts`; update or extend `app/users/actions.integration.test.ts`; create/update route integration tests as needed

  - [x]* 4.2 Add browser coverage for protected navigation and preserved public flows.
    - Extend `e2e/auth.test.ts` or add `e2e/authenticated-route-layout.test.ts` to cover unauthenticated `/users` redirects with a safe callback, authenticated users listing, direct and client-side `/users` navigation without `(authenticated)` in the pathname, and public `/`/`/sign-in` access.
    - Retain the existing database-backed auth API browser assertion and verify the users query/form remain usable under the root provider; do not add provider-login automation that requires external credentials.
    - _Requirements: 1.1–1.5, 2.1–2.4, 3.3, 6.1–6.5_
    - _Affected files: update `e2e/auth.test.ts` and/or create `e2e/authenticated-route-layout.test.ts`

- [x] 5. Checkpoint - Validate the integrated refactor
  - Ensure all implementation and automated tests pass before final verification; resolve any questions or failures without expanding the feature beyond the validated requirements.

- [x] 6. Run final project verification
  - [x] 6.1 Run formatting, lint, typecheck, build, unit/integration, and browser verification for the completed refactor.
    - Run `pnpm format:check`, `pnpm lint:check`, `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm test`, and `pnpm e2e` (with the repository’s required database/environment setup).
    - Fix only implementation/test issues caused by this refactor, then rerun the complete sequence and confirm no generated or temporary application files are left behind.
    - _Requirements: 1.1–6.6_
    - _Affected files: all files changed by tasks 1–4; verification only, no new feature scope

## Notes

- Tasks marked with `*` are optional test tasks and may be skipped for a faster MVP; all non-starred implementation and verification tasks are required.
- The design contains five correctness properties, so each property has its own property-based or property-oriented test task. Property tests must exercise at least 100 generated cases and include the feature/property tag specified in the design.
- The route group is organizational only: `(authenticated)` must never appear in browser-visible URLs, and no new users descendant route may be introduced.
- Preserve the existing `app/api/auth/[...all]/route.ts`, `lib/auth-client.ts`, users repository/actions/schema, provider configuration, and users listing/creation scope. Account deletion is explicitly out of scope.
- The existing scripts provide the expected commands: `pnpm test:unit`, `pnpm test:integration`, `pnpm test`, and `pnpm e2e`; the final task also runs the project’s format, lint, typecheck, and build checks.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "2.2"] },
    { "id": 1, "tasks": ["1.2", "2.4", "2.5"] },
    { "id": 2, "tasks": ["1.3", "1.4", "2.3"] },
    { "id": 3, "tasks": ["2.6", "2.7", "2.8"] },
    { "id": 4, "tasks": ["2.9"] },
    { "id": 5, "tasks": ["3.1"] },
    { "id": 6, "tasks": ["3.2", "4.1"] },
    { "id": 7, "tasks": ["4.2"] },
    { "id": 8, "tasks": ["6.1"] }
  ]
}
```

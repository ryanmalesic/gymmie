# Requirements Document

## Introduction

The Gymmie application will refactor authenticated routing so the `/users` route is protected by a shared Next.js authenticated route-group layout. App-wide providers will remain in the root layout, and authentication behavior will have one server-side route-layout protection path for the initial request. The refactor will remove obsolete freshness controls and preserve the public routes, authentication API, and existing users functionality.

## Glossary

- **Next.js Application**: The Gymmie web application using the Next.js App Router.
- **Root Layout**: The `app/layout.tsx` document layout that wraps every application route.
- **Authenticated Route Group**: The route group represented by `app/(authenticated)/`, which groups routes requiring an authenticated session without adding `(authenticated)` to the public URL.
- **Authenticated Layout**: The server-side layout represented by `app/(authenticated)/layout.tsx`, which protects every route in the Authenticated Route Group.
- **Users Route**: The route available at `/users`, including the existing users list and user-creation functionality.
- **Public Landing Page**: The route available at `/`.
- **Sign-in Page**: The route available at `/sign-in` that starts the configured social sign-in flow.
- **Auth API**: The authentication handler available under `/api/auth/*`.
- **Authentication Module**: The application code that retrieves and exposes the current authentication session.
- **Route Layout Refactor**: This feature's change to authenticated route grouping, provider placement, and authentication protection.
- **QueryProvider**: The application-wide React Query provider currently supplied by `@/lib/query/providers`.
- **Session Resolver**: The server-side authentication operation that retrieves the current session from the request.
- **Safe Callback URL**: An origin-relative callback value containing the original internal path and query string, beginning with one `/`, excluding a `//` prefix, and excluding a scheme or host.
- **Freshness Controls**: The `forceFresh` parameter or prop, session-age comparisons, cache-bypass query hints used only for freshness checks, and the `fresh=1` sign-in query hint.

## Requirements

### Requirement 1: Authenticated route-group organization

**User Story:** As a maintainer, I want protected routes grouped by a shared App Router layout, so authentication policy is applied consistently without changing public URLs.

#### Acceptance Criteria

1. THE Next.js Application SHALL resolve an exact request to `/users` through the Authenticated Route Group.
2. THE Next.js Application SHALL resolve valid descendant requests under `/users/` through the Authenticated Route Group when such descendants are present, while this refactor SHALL add no new descendant route.
3. THE Authenticated Route Group SHALL contain `/users` as the only current application route requiring the group during this refactor.
4. WHEN a request targets `/`, `/sign-in`, or any `/api/auth/*` URL, THE Next.js Application SHALL resolve the request outside the Authenticated Route Group.
5. WHEN the Authenticated Route Group resolves `/users`, THE browser-visible pathname SHALL remain `/users`; the route-group name SHALL not appear in the URL for direct requests or client-side navigation.

### Requirement 2: Server-side authentication and safe redirection

**User Story:** As an unauthenticated visitor, I want protected requests to send me to sign-in and return me to the requested internal page after sign-in, so access control is secure and predictable.

#### Acceptance Criteria

1. WHEN an unauthenticated request targets a route in the Authenticated Route Group, THE Authenticated Layout SHALL redirect the request to the sign-in page at `/sign-in`.
2. WHEN an authenticated request targets a route in the Authenticated Route Group, THE Authenticated Layout SHALL render the content for the requested route without redirecting to `/sign-in`.
3. WHEN the Authenticated Layout redirects an unauthenticated request, THE Authenticated Layout SHALL include a `callbackUrl` whose value equals the original request path followed by its exact query string, if one is present; for a request to `/`, the value SHALL be `/` when no query string is present.
4. WHEN the Authenticated Layout creates a `callbackUrl`, THE Authenticated Layout SHALL create a Safe Callback URL that is no more than 2048 characters long, has no scheme, host, fragment, control character, or backslash, begins with exactly one `/` rather than `//`, and represents only an internal path with an optional query string.
5. WHEN a sign-in request contains a Safe Callback URL, THE Sign-in Page SHALL pass that callback value unchanged to the configured sign-in provider flow.
6. IF a sign-in request contains a callback value that is missing, malformed, longer than 2048 characters, or is not a Safe Callback URL, THEN THE Sign-in Page SHALL omit that value from the configured sign-in provider flow and use `/` as the post-sign-in destination.

### Requirement 3: Root-level provider placement

**User Story:** As a developer, I want app-wide providers in the root layout, so public and authenticated routes share one provider boundary.

#### Acceptance Criteria

1. THE Root Layout SHALL render exactly one QueryProvider boundary that encloses the complete application route tree, including both public and authenticated route segments.
2. WHEN the Authenticated Layout renders, THE Next.js Application SHALL obtain its QueryProvider context from the boundary rendered by the Root Layout and SHALL NOT render an additional QueryProvider boundary within the Authenticated Layout.
3. WHEN the Public Landing Page, Sign-in Page, or Users Route renders during either an initial page load or client-side navigation, THE Next.js Application SHALL make the QueryProvider context from the Root Layout available to that route.

### Requirement 4: Deduplicated authentication protection

**User Story:** As a maintainer, I want one shared server-side authentication guard for protected routes, so client and server wrappers cannot drift apart.

#### Acceptance Criteria

1. THE Authenticated Route Group SHALL use the server-side Authenticated Layout as the only authentication guard executed during the initial render of every route in the group.
2. WHEN an authenticated request renders the Users Route, THE Users Route SHALL render the existing users functionality without adding or executing a separate page-level Authenticated wrapper.
3. THE Session Resolver SHALL provide the session check consumed by the Authenticated Layout during the initial render, and the application SHALL NOT require a second client-side or server-side session check for that same initial render.
4. WHEN a session expires after the initial route render, THE Next.js Application SHALL handle each subsequent request using the existing session-expiration behavior and SHALL NOT add or execute a second initial-render authentication guard.
5. WHEN an unauthenticated request targets any route in the Authenticated Route Group, THE Authenticated Layout SHALL remain the component responsible for the initial authentication decision, and no route-specific authentication wrapper SHALL perform an additional initial authentication decision.

### Requirement 5: Removal of obsolete freshness controls

**User Story:** As a maintainer, I want obsolete freshness behavior removed, so route authentication has one standard session contract and no dead supporting code.

#### Acceptance Criteria

1. THE Authentication Module SHALL expose all authentication interfaces and props without a `forceFresh` parameter or prop.
2. WHEN the Session Resolver retrieves a session for authenticated route protection, THE Session Resolver SHALL use standard session retrieval without passing, enabling, or otherwise requesting a Freshness Control, regardless of the session age or route-protection request context.
3. THE Authentication Module SHALL determine authenticated route protection without comparing session age and SHALL omit freshness-only cache-bypass query hints from every session-retrieval request.
4. WHEN the Authenticated Layout redirects an unauthenticated request, THE Authenticated Layout SHALL generate a redirect target that contains no query parameter named `fresh`, including when the value would otherwise be `true`, `false`, empty, malformed, or any other value.
5. WHEN the Sign-in Page loads, THE Sign-in Page SHALL render and behave identically whether the request contains no `fresh` query parameter or contains `fresh` with a `true`, `false`, empty, malformed, or other value, and SHALL derive no freshness-specific state from that parameter.

### Requirement 6: Preservation of public routes and existing functionality

**User Story:** As an application user, I want the existing public, sign-in, and users experiences to continue working after the layout refactor, so the refactor does not change unrelated behavior.

#### Acceptance Criteria

1. WHILE a request has no authenticated session, WHEN the request targets `/`, THE Public Landing Page SHALL remain accessible without requiring authentication or redirecting to the Sign-in Page, including when no session exists or an existing session has expired.
2. WHILE a request has no authenticated session, WHEN the request targets `/sign-in`, THE Sign-in Page SHALL remain accessible without requiring authentication or redirecting to another protected route, including when no session exists or an existing session has expired.
3. WHEN a request targets an authentication path under `/api/auth/` that was supported before the layout refactor, THE Auth API SHALL process the request through the configured authentication flow with the same externally observable success, failure, and session behavior as before the refactor.
4. WHEN an authenticated request targets `/users`, THE Users Route SHALL provide the existing users listing with the same externally observable data and behavior as before the layout refactor.
5. WHEN an authenticated user performs the existing user-creation operation, THE Users Route SHALL create a user for valid input and reject invalid input with the same externally observable success, failure, validation, and data-preservation behavior as before the refactor.
6. THE Route Layout Refactor SHALL preserve the users experience scope to users listing and user creation and SHALL NOT expose account deletion or any other business action that was not available before the refactor.

## Correctness Properties for Property-Based Testing

The following properties are suitable for property-based tests. Each property should generate the stated input space and assert the invariant for every generated example.

### Property 1: Protected route-group and access invariant

- **Generator:** Generate exact `/users` requests, valid descendant requests under `/users/` when such descendants are present, direct requests, client-side navigations, and authenticated or unauthenticated session states.
- **Invariant:** Every generated protected request resolves through the Authenticated Route Group without adding a new descendant route; the browser-visible pathname remains `/users` for the `/users` route and never includes the route-group name; every unauthenticated request produces a redirect to `/sign-in`; and every authenticated request renders the requested protected route without an authentication redirect.
- **Covers:** Requirements 1.1–1.5, 2.1–2.2, 4.1, and 4.5.

### Property 2: Callback URL safety and fidelity invariant

- **Generator:** Generate internal request paths, including `/`, exact `/users`, valid `/users/` descendants, and encoded path characters, together with empty, encoded, and arbitrary user-controlled query strings.
- **Invariant:** Every generated redirect callback equals the original path followed by its exact query string when present, uses `/` for a queryless request to `/`, is no more than 2048 characters, begins with exactly one `/` rather than `//`, contains no scheme, host, fragment, control character, or backslash, and represents only an internal path with an optional query string.
- **Covers:** Requirements 2.3 and 2.4.

### Property 3: Callback validation and propagation invariant

- **Generator:** Generate valid Safe Callback URLs and callback values that are missing, malformed, longer than 2048 characters, or otherwise unsafe, across each configured sign-in provider.
- **Invariant:** The Sign-in Page passes every valid Safe Callback URL unchanged to each configured provider; the Sign-in Page omits every invalid or missing callback value and uses `/` as the post-sign-in destination.
- **Covers:** Requirements 2.5–2.6.

### Property 4: Single root provider boundary invariant

- **Generator:** Generate each preserved route category—public landing, sign-in, auth API, and authenticated users route—during initial page loads and client-side navigations.
- **Invariant:** The Root Layout renders exactly one QueryProvider boundary around the complete route tree; every generated route receives that context; and the Authenticated Layout renders no additional QueryProvider boundary.
- **Covers:** Requirements 3.1–3.3.

### Property 5: Single initial authentication guard invariant

- **Generator:** Generate authenticated and unauthenticated initial requests for every route in the Authenticated Route Group, with and without a later session expiration event.
- **Invariant:** The Authenticated Layout is the only initial-render authentication guard; the Session Resolver supplies its initial session check; the Users Route executes no separate page-level wrapper or session check for that initial render; and subsequent expired-session requests preserve existing session-expiration behavior without adding another initial-render guard.
- **Covers:** Requirements 4.1–4.5.

### Property 6: Freshness-control absence invariant

- **Generator:** Generate supported authenticated route-protection calls, session ages, unauthenticated redirects, and sign-in requests whose `fresh` query parameter is absent or has true, false, empty, malformed, or other values.
- **Invariant:** No generated authentication interface accepts or forwards `forceFresh`; no generated session request enables a Freshness Control, compares session age, or includes a freshness-only cache-bypass hint; no generated redirect target contains a `fresh` query parameter; and the Sign-in Page derives no freshness-specific state or behavior from any generated `fresh` value.
- **Covers:** Requirements 5.1–5.5.

### Property 7: Public-route and Auth API preservation invariant

- **Generator:** Generate requests for `/`, `/sign-in`, and authentication paths under `/api/auth/` that were supported before the refactor, with no session, a valid session, and an expired session, using the pre-refactor externally observable API outcomes as the baseline.
- **Invariant:** Public landing and sign-in requests remain accessible without an authentication redirect regardless of session absence or expiration; every supported Auth API request remains outside the Authenticated Route Group and preserves its baseline success, failure, and session behavior.
- **Covers:** Requirements 1.4 and 6.1–6.3.

### Property 8: Users behavior and scope preservation invariant

- **Generator:** Generate valid and invalid existing users-list and user-creation inputs while varying authenticated, unauthenticated, and expired session states according to the route-access rules.
- **Invariant:** Authenticated `/users` requests retain the baseline users-list data and behavior; valid user creation and invalid-input rejection retain baseline success, failure, validation, and data-preservation behavior; unauthenticated or expired `/users` requests redirect before protected page content renders; and the route exposes only the pre-existing users listing and user-creation actions.
- **Covers:** Requirements 2.1–2.2 and 6.4–6.6.

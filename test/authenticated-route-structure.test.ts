import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "vitest";

const projectRoot = process.cwd();
const appRoot = resolve(projectRoot, "app");
const authenticatedRoot = resolve(appRoot, "(authenticated)");
const usersPagePath = resolve(authenticatedRoot, "users/page.tsx");
const sessionResolverPath = resolve(projectRoot, "lib/auth/get-session.ts");
const signInPagePath = resolve(appRoot, "sign-in/page.tsx");
const authApiRoutePath = resolve(appRoot, "api/auth/[...all]/route.ts");

const obsoleteGuardPaths = [
  "components/auth/authenticated.tsx",
  "components/auth/authenticated-server.tsx",
  "components/auth/authenticated-client.tsx",
];
const requestTargetProxyPath = resolve(projectRoot, "proxy.ts");

function applicationSourceFiles(directory: string): string[] {
  if (!existsSync(directory)) {
    return [];
  }

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = resolve(directory, entry.name);

    if (entry.isDirectory()) {
      return applicationSourceFiles(entryPath);
    }

    return /\.(?:ts|tsx)$/.test(entry.name) && !entry.name.includes(".test.")
      ? [entryPath]
      : [];
  });
}

function readApplicationSources(): string {
  const sourceFiles = [
    ...applicationSourceFiles(appRoot),
    ...applicationSourceFiles(resolve(projectRoot, "components")),
    ...applicationSourceFiles(resolve(projectRoot, "lib")),
    ...(existsSync(resolve(projectRoot, "proxy.ts"))
      ? [resolve(projectRoot, "proxy.ts")]
      : []),
  ];

  return sourceFiles
    .map((filePath) => readFileSync(filePath, "utf8"))
    .join("\n");
}

// Feature: authenticated-route-layout-refactor, structural cleanup coverage

test("removes obsolete guards and all imports of their modules", () => {
  for (const relativePath of obsoleteGuardPaths) {
    expect(existsSync(resolve(projectRoot, relativePath))).toBe(false);
  }

  expect(readApplicationSources()).not.toMatch(
    /(?:components\/auth|from\s+["'][^"']*authenticated|import\s+["'][^"']*proxy)/,
  );
});

test("uses the proxy only to forward a safe request target", () => {
  const proxySource = readFileSync(requestTargetProxyPath, "utf8");

  expect(proxySource).toContain("NextResponse.next");
  expect(proxySource).toContain("request.nextUrl.pathname");
  expect(proxySource).toContain("request.nextUrl.search");
  expect(proxySource).not.toMatch(/getSession|redirect\(/);
});

test("keeps the users page free of page-level authentication wrappers", () => {
  const usersPageSource = readFileSync(usersPagePath, "utf8");

  expect(usersPageSource).not.toMatch(
    /Authenticated|getSession|components\/auth/,
  );
  expect(existsSync(resolve(appRoot, "users/page.tsx"))).toBe(false);
  expect(existsSync(usersPagePath)).toBe(true);
});

test("keeps the session resolver on the no-options standard contract", () => {
  const sessionResolverSource = readFileSync(sessionResolverPath, "utf8");

  expect(sessionResolverSource).toMatch(
    /export async function getSession\(\): Promise<null \| SessionData>/,
  );
  expect(sessionResolverSource).toMatch(
    /auth\.api\.getSession\(\{[\s\S]*headers:\s*await headers\(\),[\s\S]*\}\)/,
  );
  expect(sessionResolverSource).not.toMatch(
    /forceFresh|disableCookieCache|createdAt|fresh|query\s*:/,
  );
});

test("removes freshness controls from routes and sign-in behavior", () => {
  const applicationSources = readApplicationSources();

  expect(applicationSources).not.toMatch(
    /forceFresh|fresh=1|isFreshRequired|disableCookieCache|FRESH_AGE_MS/,
  );
  expect(readFileSync(signInPagePath, "utf8")).not.toMatch(
    /searchParams\.get\(["']fresh["']\)|fresh/,
  );
  expect(
    readFileSync(resolve(authenticatedRoot, "layout.tsx"), "utf8"),
  ).not.toMatch(/redirect\([^)]*fresh|[?&]fresh[=&#]/);
});

test("keeps the auth API route outside the authenticated group", () => {
  expect(existsSync(authApiRoutePath)).toBe(true);
  expect(statSync(authApiRoutePath).isFile()).toBe(true);
  expect(existsSync(resolve(authenticatedRoot, "api"))).toBe(false);
  expect(readFileSync(authApiRoutePath, "utf8")).toContain(
    "toNextJsHandler(auth)",
  );
});

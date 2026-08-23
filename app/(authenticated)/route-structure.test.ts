import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "vitest";

const appRoot = resolve(process.cwd(), "app");
const authenticatedRoot = resolve(appRoot, "(authenticated)");
const authenticatedLayoutSource = readFileSync(
  resolve(authenticatedRoot, "layout.tsx"),
  "utf8",
);

// Feature: authenticated-route-layout-refactor, Property 4: Single provider boundary and route availability
test("keeps the authenticated layout free of provider boundaries", () => {
  expect(authenticatedLayoutSource).not.toMatch(/QueryProvider/);
});

test("keeps only users routes in the authenticated group", () => {
  const groupEntries = readdirSync(authenticatedRoot, {
    withFileTypes: true,
  })
    .filter((entry) => !entry.name.includes(".test."))
    .map((entry) => entry.name)
    .sort();

  expect(groupEntries).toEqual(["layout.tsx", "users"]);
  expect(
    readdirSync(resolve(authenticatedRoot, "users"), {
      withFileTypes: true,
    })
      .filter((entry) => !entry.name.includes(".test."))
      .map((entry) => entry.name),
  ).toEqual(["page.tsx"]);
});

test("keeps public and auth API routes outside the authenticated group", () => {
  const publicAndApiRoutes = [
    "page.tsx",
    "sign-in/page.tsx",
    "api/auth/[...all]/route.ts",
  ];

  for (const route of publicAndApiRoutes) {
    expect(existsSync(resolve(appRoot, route))).toBe(true);
  }

  expect(existsSync(resolve(authenticatedRoot, "page.tsx"))).toBe(false);
  expect(existsSync(resolve(authenticatedRoot, "sign-in"))).toBe(false);
  expect(existsSync(resolve(authenticatedRoot, "api"))).toBe(false);
});

test("does not add the route-group name to a browser route path", () => {
  expect(existsSync(resolve(appRoot, "users/page.tsx"))).toBe(false);
  expect(existsSync(resolve(authenticatedRoot, "users/page.tsx"))).toBe(true);
});

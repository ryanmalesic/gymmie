import type { ReactNode } from "react";

import { redirect } from "next/navigation";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, expect, test, vi } from "vitest";

import AuthenticatedLayout from "@/app/(authenticated)/layout";
import { getSession } from "@/lib/auth/get-session";
import { getSafeRequestCallbackUrl } from "@/lib/auth/request-target";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/lib/auth/get-session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/auth/request-target", () => ({
  getSafeRequestCallbackUrl: vi.fn(),
}));

class RedirectedError extends Error {
  constructor(readonly destination: string) {
    super(`redirected to ${destination}`);
  }
}

const routeGroupDirectory = dirname(fileURLToPath(import.meta.url));
const authenticatedLayoutSource = readFileSync(
  join(routeGroupDirectory, "layout.tsx"),
  "utf8",
);
const usersRouteSource = readFileSync(
  join(routeGroupDirectory, "users/page.tsx"),
  "utf8",
);
const authenticatedSession = {} as NonNullable<
  Awaited<ReturnType<typeof getSession>>
>;

function protectedRoutePaths(
  directory: string,
  segments: string[] = [],
): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      return protectedRoutePaths(entryPath, [...segments, entry.name]);
    }

    if (entry.name !== "page.tsx") {
      return [];
    }

    return [`/${segments.join("/")}`];
  });
}

const currentProtectedRoutes = protectedRoutePaths(routeGroupDirectory).sort();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(redirect).mockImplementation((destination) => {
    throw new RedirectedError(destination);
  });
  vi.mocked(getSafeRequestCallbackUrl).mockResolvedValue("/users");
});

// Feature: authenticated-route-layout-refactor, Property 5: One initial session decision and standard session contract

test("uses one layout guard and keeps authentication out of the users page", () => {
  expect(authenticatedLayoutSource.match(/\bgetSession\(\)/g)).toHaveLength(1);
  expect(authenticatedLayoutSource).not.toMatch(/QueryProvider/);
  expect(authenticatedLayoutSource).not.toMatch(
    /forceFresh|disableCookieCache|FRESH_AGE_MS|createdAt|session age/i,
  );
  expect(usersRouteSource).not.toMatch(/\bgetSession\b/);
  expect(usersRouteSource).not.toMatch(/Authenticated/);
});

test("renders authenticated content after one session decision", async () => {
  vi.mocked(getSession).mockResolvedValue(authenticatedSession);
  const children = { content: "protected" } as unknown as ReactNode;

  await expect(AuthenticatedLayout({ children })).resolves.toBe(children);

  expect(getSession).toHaveBeenCalledTimes(1);
  expect(redirect).not.toHaveBeenCalled();
});

test("redirects before returning unauthenticated content", async () => {
  vi.mocked(getSession).mockResolvedValue(null);
  const children = { content: "must-not-render" } as unknown as ReactNode;

  await expect(AuthenticatedLayout({ children })).rejects.toMatchObject({
    destination: expect.stringContaining("/sign-in?callbackUrl="),
  });

  expect(getSession).toHaveBeenCalledTimes(1);
  expect(redirect).toHaveBeenCalledTimes(1);
});

// Feature: authenticated-route-layout-refactor, Property 1: Protected route access and URL invariants

test.each(currentProtectedRoutes)(
  "renders each protected route for an authenticated session: %s",
  async (routePath) => {
    vi.mocked(getSession).mockResolvedValue(authenticatedSession);
    const children = { routePath } as unknown as ReactNode;

    await expect(AuthenticatedLayout({ children })).resolves.toBe(children);

    expect(getSession).toHaveBeenCalledTimes(1);
    expect(redirect).not.toHaveBeenCalled();
    expect(routePath).toBe("/users");
    expect(routePath).not.toContain("(authenticated)");
  },
);

test.each(currentProtectedRoutes)(
  "redirects each protected route for an unauthenticated session: %s",
  async (routePath) => {
    vi.mocked(getSession).mockResolvedValue(null);
    vi.mocked(getSafeRequestCallbackUrl).mockResolvedValue(routePath);

    const result = AuthenticatedLayout({ children: null });

    await expect(result).rejects.toMatchObject({
      destination: expect.stringContaining("/sign-in?callbackUrl="),
    });
    expect(getSession).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledTimes(1);

    const destination = vi.mocked(redirect).mock.calls[0][0];
    const redirectUrl = new URL(destination, "http://localhost:3000");
    expect(redirectUrl.pathname).toBe("/sign-in");
    expect(redirectUrl.searchParams.get("callbackUrl")).toBe(routePath);
    expect(routePath).not.toContain("(authenticated)");
  },
);

test("maps the route-group page to /users without exposing the group name", () => {
  expect(currentProtectedRoutes).toEqual(["/users"]);
  expect(currentProtectedRoutes).not.toContain("/(authenticated)/users");
  expect(
    currentProtectedRoutes.every((route) => route.startsWith("/users")),
  ).toBe(true);
});

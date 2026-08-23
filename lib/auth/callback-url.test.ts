import { expect, test } from "vitest";

import {
  buildCallbackUrl,
  isSafeCallbackUrl,
  normalizeCallbackUrl,
} from "@/lib/auth/callback-url";

const safePathnames = [
  "/",
  "/users",
  "/users/",
  "/users/%5Bencoded%5D",
  "/caf%C3%A9/%E2%9C%93",
];

const safeQuerySeeds = [
  "",
  "?",
  "sort=name&filter=a%2Fb",
  "q=%E2%9C%93&order=desc",
  "next=https%3A%2F%2Fevil.example%2Fpath",
  "a=1&a=2&empty=&encoded=%26%3D%3F",
];

function generateSafeCallbackCases() {
  return Array.from({ length: 30 }, (_, index) =>
    safePathnames.flatMap((pathname) =>
      safeQuerySeeds.map((querySeed) => {
        const suffix = querySeed
          ? `&case=${index}`
          : index === 0
            ? ""
            : `?case=${index}`;
        const queryString = querySeed ? `${querySeed}${suffix}` : suffix;

        return { pathname, queryString };
      }),
    ),
  ).flat();
}

function generateUnsafeCallbackCandidates() {
  const categories = [
    (index: number) => `//evil.example/users?case=${index}`,
    (index: number) => `https://evil.example/users?case=${index}`,
    (index: number) => `/users#fragment-${index}`,
    (index: number) => `/users\\settings?case=${index}`,
    () => `/users?value=control${String.fromCharCode(1)}`,
    () => `/users?value=delete${String.fromCharCode(127)}`,
    () => `/users?value=nonascii-control${String.fromCharCode(159)}`,
    (index: number) => `/users?${"x".repeat(2049 + index)}`,
    (index: number) => `users?case=${index}`,
    (index: number) => `javascript:alert(${index})`,
  ];

  return Array.from({ length: 120 }, (_, index) =>
    categories[index % categories.length](index),
  );
}

test("preserves a safe callback path and exact query bytes", () => {
  const pathname = "/users/%5Bencoded%5D";
  const queryString = "?sort=name&filter=a%2Fb&empty=&sort=name";

  expect(buildCallbackUrl(pathname, queryString)).toBe(
    `${pathname}${queryString}`,
  );
});

test("accepts query metadata with or without its leading separator", () => {
  expect(buildCallbackUrl("/users", "sort=name&filter=a%2Fb")).toBe(
    "/users?sort=name&filter=a%2Fb",
  );
  expect(buildCallbackUrl("/users", "")).toBe("/users");
  expect(buildCallbackUrl("/", "?")).toBe("/?");
});

test("normalizes missing and unsafe callback values to the root", () => {
  expect(normalizeCallbackUrl(undefined)).toBe("/");
  expect(normalizeCallbackUrl(null)).toBe("/");
  expect(normalizeCallbackUrl("//evil.example/users")).toBe("/");
  expect(normalizeCallbackUrl("/users#fragment")).toBe("/");
  expect(normalizeCallbackUrl("/users\\settings")).toBe("/");
  expect(normalizeCallbackUrl(`/users?value=${String.fromCharCode(1)}`)).toBe(
    "/",
  );
  expect(normalizeCallbackUrl(`/users?${"x".repeat(2049)}`)).toBe("/");
});

test("rejects pathname input that already contains query or fragment bytes", () => {
  expect(buildCallbackUrl("/users?sort=name", "page=2")).toBe("/");
  expect(buildCallbackUrl("/users#fragment", "page=2")).toBe("/");
});

test("Feature: authenticated-route-layout-refactor, Property 2: Callback safety, fidelity, and freshness absence", () => {
  const generatedCases = generateSafeCallbackCases();

  expect(generatedCases).toHaveLength(900);

  for (const { pathname, queryString } of generatedCases) {
    const expected = queryString
      ? `${pathname}${queryString.startsWith("?") ? "" : "?"}${queryString}`
      : pathname;
    const callbackUrl = buildCallbackUrl(pathname, queryString);

    expect(callbackUrl).toBe(expected);
    expect(callbackUrl).toHaveLength(expected.length);
    expect(callbackUrl).toMatch(/^\/(?!\/)/u);
    expect(isSafeCallbackUrl(callbackUrl)).toBe(true);
    expect(callbackUrl).not.toContain("#");
    expect(callbackUrl).not.toContain("\\");
  }
});

test("falls back for every generated unsafe callback candidate", () => {
  const generatedCandidates = generateUnsafeCallbackCandidates();

  expect(generatedCandidates).toHaveLength(120);

  for (const candidate of generatedCandidates) {
    expect(isSafeCallbackUrl(candidate)).toBe(false);
    expect(normalizeCallbackUrl(candidate)).toBe("/");
  }
});

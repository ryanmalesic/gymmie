import { expect, test } from "vitest";

import {
  DEFAULT_CALLBACK_PATH,
  getSafeCallbackPath,
} from "@/lib/auth/session.client";

test("returns candidate when it is a safe relative callback path", () => {
  expect(getSafeCallbackPath("/users", "/fallback")).toBe("/users");
  expect(
    getSafeCallbackPath("/users?tab=members&filter=name%3Aalice", "/fallback"),
  ).toBe("/users?tab=members&filter=name%3Aalice");
});

test("reinserts leading slash when candidate or fallback is missing it", () => {
  expect(getSafeCallbackPath("users", "/fallback")).toBe("/users");
  expect(
    getSafeCallbackPath("users?tab=members&filter=name%3Aalice", "/fallback"),
  ).toBe("/users?tab=members&filter=name%3Aalice");
  expect(getSafeCallbackPath(null, "users")).toBe("/users");
});

test("returns fallback when candidate is unsafe or missing", () => {
  expect(getSafeCallbackPath(null, "/users")).toBe("/users");
  expect(getSafeCallbackPath(undefined, "/users")).toBe("/users");
  expect(getSafeCallbackPath("", "/users")).toBe("/users");
  expect(getSafeCallbackPath("https://evil.example//evil", "/users")).toBe(
    "/users",
  );
  expect(getSafeCallbackPath("//evil.example/path", "/users")).toBe("/users");
});

test("rejects candidates with invalid characters, fragments, or malformed encodings", () => {
  expect(getSafeCallbackPath("/users#fragment", "/fallback")).toBe("/fallback");
  expect(getSafeCallbackPath("users#fragment", "/fallback")).toBe("/fallback");
  expect(getSafeCallbackPath("/users\\path", "/fallback")).toBe("/fallback");
  expect(getSafeCallbackPath("/users\u0000test", "/fallback")).toBe(
    "/fallback",
  );
  expect(getSafeCallbackPath("/users%2", "/fallback")).toBe("/fallback");
  expect(getSafeCallbackPath("/users%ZZ", "/fallback")).toBe("/fallback");
});

test("rejects candidates exceeding maximum length", () => {
  const longPath = "/" + "a".repeat(2048);
  expect(getSafeCallbackPath(longPath, "/fallback")).toBe("/fallback");
});

test("returns DEFAULT_CALLBACK_PATH when candidate and fallback are both unsafe", () => {
  expect(
    getSafeCallbackPath("https://evil.example", "https://evil.example"),
  ).toBe(DEFAULT_CALLBACK_PATH);
  expect(getSafeCallbackPath(null, "//evil.example")).toBe(
    DEFAULT_CALLBACK_PATH,
  );
});

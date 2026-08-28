import { expect, test } from "vitest";

import { HttpsUrl, WireBool, WireDateTime, WireInt } from "@/lib/zod";

test("WireDateTime parses dates and ISO strings", () => {
  const now = new Date();
  expect(WireDateTime.parse(now)).toEqual(now);
  const parsed = WireDateTime.parse(now.toISOString());
  expect(parsed).toEqual(now);
});

test("WireInt parses numbers and numeric strings", () => {
  expect(WireInt(1, 100).parse(15)).toBe(15);
  expect(WireInt(1, 100).parse("15")).toBe(15);
  expect(() => WireInt(1, 100).parse(0)).toThrow();
  expect(() => WireInt(1, 100).parse("abc")).toThrow();
});

test("WireBool parses booleans and wire strings", () => {
  expect(WireBool.parse(true)).toBe(true);
  expect(WireBool.parse("true")).toBe(true);
  expect(WireBool.parse("1")).toBe(true);
  expect(WireBool.parse("false")).toBe(false);
  expect(WireBool.parse("0")).toBe(false);
});

test("HttpsUrl validates https URLs and rejects non-https", () => {
  expect(HttpsUrl.parse("https://example.com/logo.png")).toBe(
    "https://example.com/logo.png",
  );
  expect(() => HttpsUrl.parse("http://example.com/logo.png")).toThrow();
  expect(() => HttpsUrl.parse("not-a-url")).toThrow();
});

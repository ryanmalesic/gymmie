import { expect, test } from "vitest";

import {
  Email,
  HttpsUrl,
  IanaTimezone,
  IsoCountry,
  Latitude,
  Longitude,
  UsPhone,
  UsPostalCode,
  UsState,
  WireBool,
  WireDateTime,
  WireInt,
} from "@/lib/zod";

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

test("Email trims, lowercases, and rejects invalid addresses", () => {
  expect(Email.parse("  Ada@Example.com ")).toBe("ada@example.com");
  expect(() => Email.parse("   ")).toThrow();
  expect(() => Email.parse("ada")).toThrow();
});

test("UsPhone canonicalizes US numbers", () => {
  expect(UsPhone.parse("4155551234")).toBe("+1 (415) 555-1234");
  expect(UsPhone.parse("1 415 555 1234")).toBe("+1 (415) 555-1234");
  expect(UsPhone.parse("+1-415-555-1234")).toBe("+1 (415) 555-1234");
  expect(UsPhone.parse("+1 (415) 555-1234")).toBe("+1 (415) 555-1234");
});

test("UsPhone rejects non-US and invalid numbers", () => {
  expect(() => UsPhone.parse("+44 20 7946 0958")).toThrow();
  expect(() => UsPhone.parse("123")).toThrow();
  expect(() => UsPhone.parse("0155551234")).toThrow();
});

test("UsState uppercases and validates USPS codes", () => {
  expect(UsState.parse(" ca ")).toBe("CA");
  expect(() => UsState.parse("ZZ")).toThrow();
});

test("UsPostalCode accepts ZIP and ZIP+4", () => {
  expect(UsPostalCode.parse("94107")).toBe("94107");
  expect(UsPostalCode.parse("94107-1234")).toBe("94107-1234");
  expect(() => UsPostalCode.parse("9410")).toThrow();
});

test("IsoCountry uppercases two-letter codes", () => {
  expect(IsoCountry.parse(" us ")).toBe("US");
  expect(() => IsoCountry.parse("USA")).toThrow();
});

test("IanaTimezone accepts IANA zones", () => {
  expect(IanaTimezone.parse("America/New_York")).toBe("America/New_York");
  expect(() => IanaTimezone.parse("Not/A_Zone")).toThrow();
});

test("Latitude and Longitude stay in range", () => {
  expect(Latitude.parse(37.7749)).toBe(37.7749);
  expect(Longitude.parse(-122.4194)).toBe(-122.4194);
  expect(() => Latitude.parse(91)).toThrow();
  expect(() => Longitude.parse(-181)).toThrow();
});

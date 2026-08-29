import { describe, expect, test } from "vitest";

import {
  canCreateLocation,
  isProfileComplete,
  type UserProfileCheckable,
} from "@/domain/users/gate";
import { type User } from "@/lib/generated/zod/modelSchema/UserSchema";

const validUser: User = {
  addressLine1: "123 Main St",
  addressLine2: "Suite 100",
  city: "San Francisco",
  country: "US",
  createdAt: new Date(),
  email: "user@example.com",
  emailVerified: true,
  id: "usr_123",
  image: null,
  latitude: 37.7749,
  longitude: -122.4194,
  name: "Jane Doe",
  phone: "+1 (415) 555-1234",
  postalCode: "94107",
  state: "CA",
  stripeAccountId: "acct_123",
  stripeAccountStatus: "ACTIVATED",
  timezone: "America/New_York",
  updatedAt: new Date(),
};

describe("isProfileComplete", () => {
  test("returns true when all required profile fields are present", () => {
    expect(isProfileComplete(validUser)).toBe(true);
  });

  test("returns true even if addressLine2 is missing", () => {
    const userWithoutLine2 = { ...validUser, addressLine2: null };
    expect(isProfileComplete(userWithoutLine2)).toBe(true);
  });

  test("returns false for null/undefined user", () => {
    expect(isProfileComplete(null)).toBe(false);
    expect(isProfileComplete(undefined)).toBe(false);
  });

  test("returns false if phone is missing or blank", () => {
    expect(isProfileComplete({ ...validUser, phone: null })).toBe(false);
    expect(isProfileComplete({ ...validUser, phone: "   " })).toBe(false);
  });

  test("returns false if addressLine1 is missing or blank", () => {
    expect(isProfileComplete({ ...validUser, addressLine1: null })).toBe(false);
    expect(isProfileComplete({ ...validUser, addressLine1: "" })).toBe(false);
  });

  test("returns false if city is missing", () => {
    expect(isProfileComplete({ ...validUser, city: null })).toBe(false);
  });

  test("returns false if state is missing", () => {
    expect(isProfileComplete({ ...validUser, state: null })).toBe(false);
  });

  test("returns false if postalCode is missing", () => {
    expect(isProfileComplete({ ...validUser, postalCode: null })).toBe(false);
  });

  test("returns false if country is missing", () => {
    expect(
      isProfileComplete({
        ...validUser,
        country: null,
      } as unknown as UserProfileCheckable),
    ).toBe(false);
  });

  test("returns false if timezone is missing", () => {
    expect(
      isProfileComplete({
        ...validUser,
        timezone: null,
      } as unknown as UserProfileCheckable),
    ).toBe(false);
  });

  test("returns false if latitude or longitude is missing or NaN", () => {
    expect(isProfileComplete({ ...validUser, latitude: null })).toBe(false);
    expect(isProfileComplete({ ...validUser, longitude: null })).toBe(false);
    expect(isProfileComplete({ ...validUser, latitude: Number.NaN })).toBe(
      false,
    );
  });
});

describe("canCreateLocation", () => {
  test("returns true when profile is complete, stripeAccountId is set, and stripeAccountStatus is ACTIVATED", () => {
    expect(canCreateLocation(validUser)).toBe(true);
  });

  test("returns false if user is null or undefined", () => {
    expect(canCreateLocation(null)).toBe(false);
    expect(canCreateLocation(undefined)).toBe(false);
  });

  test("returns false if profile is incomplete", () => {
    expect(canCreateLocation({ ...validUser, phone: null })).toBe(false);
  });

  test("returns false if stripeAccountId is missing or empty", () => {
    expect(canCreateLocation({ ...validUser, stripeAccountId: null })).toBe(
      false,
    );
    expect(canCreateLocation({ ...validUser, stripeAccountId: "   " })).toBe(
      false,
    );
  });

  test("returns false if stripeAccountStatus is not ACTIVATED", () => {
    expect(
      canCreateLocation({ ...validUser, stripeAccountStatus: "PENDING" }),
    ).toBe(false);
    expect(
      canCreateLocation({ ...validUser, stripeAccountStatus: "RESTRICTED" }),
    ).toBe(false);
    expect(
      canCreateLocation({ ...validUser, stripeAccountStatus: "DISABLED" }),
    ).toBe(false);
    expect(canCreateLocation({ ...validUser, stripeAccountStatus: null })).toBe(
      false,
    );
  });
});

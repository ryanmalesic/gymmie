import { expect, test } from "vitest";
import { flattenError } from "zod";

import { createLocationSchema } from "@/domain/locations/schema";

const validCreate = {
  addressLine1: "123 Main St",
  city: "San Francisco",
  country: "US",
  email: "front-desk@ironworks.example",
  latitude: 37.7749,
  longitude: -122.4194,
  name: "Ironworks",
  phone: "4155551234",
  postalCode: "94107",
  state: "CA",
  timezone: "America/New_York",
  type: "COMMERCIAL_GYM" as const,
  website: "https://ironworks.example",
};

test("trims the name, uppercases the state, and canonicalizes the phone", () => {
  expect(
    createLocationSchema.safeParse({
      ...validCreate,
      name: "  Ironworks  ",
      phone: "4155551234",
      state: " ca ",
    }),
  ).toMatchObject({
    data: {
      name: "Ironworks",
      phone: "+1 (415) 555-1234",
      state: "CA",
    },
    success: true,
  });
});

test("accepts ZIP and ZIP+4", () => {
  expect(
    createLocationSchema.safeParse({
      ...validCreate,
      postalCode: "94107",
    }).success,
  ).toBe(true);
  expect(
    createLocationSchema.safeParse({
      ...validCreate,
      postalCode: "94107-1234",
    }).success,
  ).toBe(true);
});

test("rejects a blank name", () => {
  const result = createLocationSchema.safeParse({
    ...validCreate,
    name: "   ",
  });

  expect(result.success).toBe(false);
  if (result.success) {
    return;
  }

  expect(flattenError(result.error).fieldErrors).toEqual({
    name: ["Name is required"],
  });
});

test("rejects an invalid email", () => {
  const result = createLocationSchema.safeParse({
    ...validCreate,
    email: "not-an-email",
  });

  expect(result.success).toBe(false);
  if (result.success) {
    return;
  }

  expect(flattenError(result.error).fieldErrors).toEqual({
    email: ["Email is invalid"],
  });
});

test("rejects a non-https website", () => {
  const result = createLocationSchema.safeParse({
    ...validCreate,
    website: "http://ironworks.example",
  });

  expect(result.success).toBe(false);
  if (result.success) {
    return;
  }

  expect(flattenError(result.error).fieldErrors.website).toBeDefined();
});

test("rejects out-of-range coordinates", () => {
  const latitude = createLocationSchema.safeParse({
    ...validCreate,
    latitude: 91,
  });
  const longitude = createLocationSchema.safeParse({
    ...validCreate,
    longitude: -181,
  });

  expect(latitude.success).toBe(false);
  expect(longitude.success).toBe(false);
});

test("requires type", () => {
  const withoutType = { ...validCreate };
  Reflect.deleteProperty(withoutType, "type");
  const result = createLocationSchema.safeParse(withoutType);

  expect(result.success).toBe(false);
  if (result.success) {
    return;
  }

  expect(flattenError(result.error).fieldErrors.type).toBeDefined();
});

test("rejects client-supplied id and timestamps", () => {
  const result = createLocationSchema.safeParse({
    ...validCreate,
    createdAt: new Date(),
    id: "string",
    updatedAt: new Date(),
  });

  expect(result.success).toBe(false);
});

test("requires phone, email, website, and coordinates", () => {
  const required = [
    "email",
    "latitude",
    "longitude",
    "phone",
    "website",
  ] as const;

  for (const field of required) {
    const withoutField = { ...validCreate };
    Reflect.deleteProperty(withoutField, field);
    const result = createLocationSchema.safeParse(withoutField);

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(flattenError(result.error).fieldErrors[field]).toBeDefined();
  }
});

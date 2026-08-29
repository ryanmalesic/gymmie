import { expect, test } from "vitest";

import getMyUser, { spec } from "@/domain/users/commands/get-my.command";
import { type CommandContext } from "@/lib/commands/types";
import { type PrismaClient } from "@/lib/generated/prisma/client";

test("getMyUser command spec and execution", async () => {
  expect(spec.name).toBe("GetMyUser");

  const now = new Date();
  const user = {
    addressLine1: "123 Main St",
    addressLine2: null,
    city: "San Francisco",
    country: "US",
    createdAt: now,
    email: "ada@example.com",
    emailVerified: false,
    id: "usr_1",
    image: null,
    latitude: 37.7749,
    longitude: -122.4194,
    name: "Ada",
    phone: "+1 (415) 555-1234",
    postalCode: "94107",
    state: "CA",
    stripeAccountId: null,
    stripeAccountStatus: null,
    timezone: "America/New_York",
    updatedAt: now,
  };

  const context = {
    commandName: "GetMyUser",
    prisma: {} as PrismaClient,
    record: user,
    session: {
      session: { expiresAt: now, id: "s1" },
      user: { email: "ada@example.com", id: "usr_1" },
    },
    version: "2026-08-28",
  } as CommandContext<typeof user>;

  const result = await getMyUser({}, context);
  expect(result).toEqual(user);
});

test("getMyUser authorize allows only the session user", () => {
  const now = new Date();
  const record = {
    addressLine1: null,
    addressLine2: null,
    city: null,
    country: "US",
    createdAt: now,
    email: "ada@example.com",
    emailVerified: false,
    id: "usr_1",
    image: null,
    latitude: null,
    longitude: null,
    name: "Ada",
    phone: null,
    postalCode: null,
    state: null,
    stripeAccountId: null,
    stripeAccountStatus: null,
    timezone: "America/New_York",
    updatedAt: now,
  };

  expect(
    spec.authorize(
      { email: "ada@example.com", id: "usr_1" },
      {},
      record,
      {} as PrismaClient,
    ),
  ).toBe(true);
  expect(
    spec.authorize(
      { email: "other@example.com", id: "usr_other" },
      {},
      record,
      {} as PrismaClient,
    ),
  ).toBe(false);
});

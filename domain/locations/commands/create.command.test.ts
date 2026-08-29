import { expect, test, vi } from "vitest";

import createLocation, {
  spec,
} from "@/domain/locations/commands/create.command";
import { type CommandContext } from "@/lib/commands/types";
import { type PrismaClient } from "@/lib/generated/prisma/client";

const now = new Date();
const created = {
  addressLine1: "123 Main St",
  addressLine2: null,
  city: "San Francisco",
  country: "US",
  createdAt: now,
  email: "front-desk@ironworks.example",
  id: "loc_1",
  latitude: 37.7749,
  longitude: -122.4194,
  name: "Ironworks",
  ownerId: "usr_1",
  phone: "+1 (415) 555-1234",
  postalCode: "94107",
  state: "CA",
  status: "DRAFT" as const,
  timezone: "America/New_York",
  type: "COMMERCIAL_GYM" as const,
  updatedAt: now,
  website: "https://ironworks.example",
};

const authorizedUser = {
  addressLine1: "100 Pine St",
  addressLine2: null,
  city: "San Francisco",
  country: "US",
  createdAt: now,
  email: "ada@example.com",
  emailVerified: true,
  id: "usr_1",
  image: null,
  latitude: 37.7749,
  longitude: -122.4194,
  name: "Ada",
  phone: "+1 (415) 555-9876",
  postalCode: "94111",
  state: "CA",
  stripeAccountId: "acct_123",
  stripeAccountStatus: "ACTIVATED" as const,
  timezone: "America/New_York",
  updatedAt: now,
};

test("createLocation command spec and execution", async () => {
  expect(spec.name).toBe("CreateLocation");
  expect(spec.version).toBe("2026-08-28");

  const mockPrisma = {
    location: {
      create: vi.fn().mockResolvedValue(created),
    },
  };

  const context: CommandContext<typeof authorizedUser> = {
    commandName: "CreateLocation",
    prisma: mockPrisma as unknown as PrismaClient,
    record: authorizedUser,
    session: {
      session: { expiresAt: now, id: "s1" },
      user: { email: "ada@example.com", id: "usr_1" },
    },
    version: "2026-08-28",
  };

  const result = await createLocation(
    {
      addressLine1: "123 Main St",
      city: "San Francisco",
      email: "front-desk@ironworks.example",
      latitude: 37.7749,
      longitude: -122.4194,
      name: "Ironworks",
      phone: "+1 (415) 555-1234",
      postalCode: "94107",
      state: "CA",
      type: "COMMERCIAL_GYM",
      website: "https://ironworks.example",
    },
    context,
  );

  expect(result.ownerId).toBe("usr_1");
  expect(mockPrisma.location.create).toHaveBeenCalledWith({
    data: expect.objectContaining({
      name: "Ironworks",
      ownerId: "usr_1",
    }),
  });
});

test("createLocation authorize requires a complete profile and activated stripe account", () => {
  const input = {
    addressLine1: "123 Main St",
    city: "San Francisco",
    email: "front-desk@ironworks.example",
    latitude: 37.7749,
    longitude: -122.4194,
    name: "Ironworks",
    phone: "+1 (415) 555-1234",
    postalCode: "94107",
    state: "CA" as const,
    type: "COMMERCIAL_GYM" as const,
    website: "https://ironworks.example",
  };

  // Fully authorized user
  expect(
    spec.authorize(
      { email: "ada@example.com", id: "usr_1" },
      input,
      authorizedUser,
      {} as PrismaClient,
    ),
  ).toBe(true);

  // Incomplete profile (missing phone)
  expect(
    spec.authorize(
      { email: "ada@example.com", id: "usr_1" },
      input,
      { ...authorizedUser, phone: null },
      {} as PrismaClient,
    ),
  ).toBe(false);

  // Missing stripe account
  expect(
    spec.authorize(
      { email: "ada@example.com", id: "usr_1" },
      input,
      { ...authorizedUser, stripeAccountId: null },
      {} as PrismaClient,
    ),
  ).toBe(false);

  // Pending stripe status
  expect(
    spec.authorize(
      { email: "ada@example.com", id: "usr_1" },
      input,
      { ...authorizedUser, stripeAccountStatus: "PENDING" },
      {} as PrismaClient,
    ),
  ).toBe(false);

  // Unauthenticated session user id
  expect(
    spec.authorize(
      { email: "ada@example.com", id: "" },
      input,
      authorizedUser,
      {} as PrismaClient,
    ),
  ).toBe(false);
});

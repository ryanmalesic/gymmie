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

test("createLocation command spec and execution", async () => {
  expect(spec.name).toBe("CreateLocation");
  expect(spec.version).toBe("2026-08-28");

  const mockPrisma = {
    location: {
      create: vi.fn().mockResolvedValue(created),
    },
  };

  const context: CommandContext = {
    commandName: "CreateLocation",
    prisma: mockPrisma as unknown as PrismaClient,
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

test("createLocation authorize requires a session user id", () => {
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

  expect(
    spec.authorize(
      { email: "ada@example.com", id: "usr_1" },
      input,
      undefined,
      {} as PrismaClient,
    ),
  ).toBe(true);
  expect(
    spec.authorize(
      { email: "ada@example.com", id: "" },
      input,
      undefined,
      {} as PrismaClient,
    ),
  ).toBe(false);
});

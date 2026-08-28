import { expect, test, vi } from "vitest";

import deleteLocation, {
  spec,
} from "@/domain/locations/commands/delete.command";
import { type CommandContext } from "@/lib/commands/types";
import { type PrismaClient } from "@/lib/generated/prisma/client";

const now = new Date();
const location = {
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

test("deleteLocation command spec and execution", async () => {
  expect(spec.name).toBe("DeleteLocation");

  const mockPrisma = {
    location: {
      delete: vi.fn().mockResolvedValue(location),
    },
  };

  const context = {
    commandName: "DeleteLocation",
    prisma: mockPrisma as unknown as PrismaClient,
    record: location,
    session: {
      session: { expiresAt: now, id: "s1" },
      user: { email: "ada@example.com", id: "usr_1" },
    },
    version: "2026-08-28",
  } as CommandContext<typeof location>;

  const result = await deleteLocation({ id: "loc_1" }, context);
  expect(result).toEqual({ id: "loc_1", success: true });
  expect(mockPrisma.location.delete).toHaveBeenCalledOnce();
});

test("deleteLocation authorize allows only the owner", () => {
  const owner = { email: "ada@example.com", id: "usr_1" };
  const other = { email: "other@example.com", id: "usr_other" };

  expect(
    spec.authorize(owner, { id: "loc_1" }, location, {} as PrismaClient),
  ).toBe(true);
  expect(
    spec.authorize(other, { id: "loc_1" }, location, {} as PrismaClient),
  ).toBe(false);
});

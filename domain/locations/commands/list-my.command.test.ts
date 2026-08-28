import { expect, test, vi } from "vitest";

import listMyLocations, {
  spec,
} from "@/domain/locations/commands/list-my.command";
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

test("listMyLocations command spec and execution", async () => {
  expect(spec.name).toBe("ListMyLocations");

  const mockPrisma = {
    location: {
      count: vi.fn().mockResolvedValue(1),
      findMany: vi.fn().mockResolvedValue([location]),
    },
  };

  const context: CommandContext = {
    commandName: "ListMyLocations",
    prisma: mockPrisma as unknown as PrismaClient,
    session: {
      session: { expiresAt: now, id: "s1" },
      user: { email: "ada@example.com", id: "usr_1" },
    },
    version: "2026-08-28",
  };

  const result = await listMyLocations({ page: 1, pageSize: 20 }, context);
  expect(result.locations).toHaveLength(1);
  expect(result.totalCount).toBe(1);
  expect(mockPrisma.location.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { ownerId: "usr_1" },
    }),
  );
});

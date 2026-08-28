import { expect, test } from "vitest";

import readLocation, { spec } from "@/domain/locations/commands/read.command";
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

test("readLocation command spec and execution", async () => {
  expect(spec.name).toBe("ReadLocation");

  const context = {
    commandName: "ReadLocation",
    prisma: {} as PrismaClient,
    record: location,
    session: {
      session: { expiresAt: now, id: "s1" },
      user: { email: "ada@example.com", id: "usr_1" },
    },
    version: "2026-08-28",
  } as CommandContext<typeof location>;

  const result = await readLocation({ id: "loc_1" }, context);
  expect(result.id).toBe("loc_1");
});

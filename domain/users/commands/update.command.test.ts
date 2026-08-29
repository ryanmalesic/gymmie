import { expect, test, vi } from "vitest";

import updateUser, { spec } from "@/domain/users/commands/update.command";
import { type CommandContext } from "@/lib/commands/types";
import { type PrismaClient } from "@/lib/generated/prisma/client";

test("updateUser command spec and execution with profile fields", async () => {
  expect(spec.name).toBe("UpdateUser");

  const now = new Date();
  const updatedUserRecord = {
    addressLine1: "123 Market St",
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
    name: "Ada Updated",
    phone: "+1 (415) 555-1234",
    postalCode: "94107",
    state: "CA",
    stripeAccountId: null,
    stripeAccountStatus: null,
    timezone: "America/New_York",
    updatedAt: now,
  };

  const mockPrisma = {
    user: {
      update: vi.fn().mockResolvedValue(updatedUserRecord),
    },
  };

  const user = {
    ...updatedUserRecord,
    name: "Ada",
  };

  const context: CommandContext<typeof user> = {
    commandName: "UpdateUser",
    prisma: mockPrisma as unknown as PrismaClient,
    record: user,
    session: {
      session: { expiresAt: now, id: "s1" },
      user: { email: "ada@example.com", id: "usr_1" },
    },
    version: "2026-08-28",
  };

  const result = await updateUser(
    {
      addressLine1: "123 Market St",
      city: "San Francisco",
      country: "US",
      id: "usr_1",
      latitude: 37.7749,
      longitude: -122.4194,
      name: "Ada Updated",
      phone: "+1 (415) 555-1234",
      postalCode: "94107",
      state: "CA",
      timezone: "America/New_York",
    },
    context,
  );
  expect(result.name).toBe("Ada Updated");
  expect(result.phone).toBe("+1 (415) 555-1234");
  expect(result.city).toBe("San Francisco");
  expect(mockPrisma.user.update).toHaveBeenCalledWith({
    data: {
      addressLine1: "123 Market St",
      city: "San Francisco",
      country: "US",
      latitude: 37.7749,
      longitude: -122.4194,
      name: "Ada Updated",
      phone: "+1 (415) 555-1234",
      postalCode: "94107",
      state: "CA",
      timezone: "America/New_York",
    },
    where: { id: "usr_1" },
  });
});

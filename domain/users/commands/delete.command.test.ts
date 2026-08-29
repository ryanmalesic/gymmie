import { expect, test, vi } from "vitest";

import deleteUser, { spec } from "@/domain/users/commands/delete.command";
import { type CommandContext } from "@/lib/commands/types";
import { type PrismaClient } from "@/lib/generated/prisma/client";

test("deleteUser command spec and execution", async () => {
  expect(spec.name).toBe("DeleteUser");

  const mockPrisma = {
    user: {
      delete: vi.fn().mockResolvedValue({ id: "usr_1" }),
    },
  };

  const now = new Date();
  const user = {
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

  const context: CommandContext<typeof user> = {
    commandName: "DeleteUser",
    prisma: mockPrisma as unknown as PrismaClient,
    record: user,
    session: {
      session: { expiresAt: new Date(), id: "s1" },
      user: { email: "ada@example.com", id: "usr_1" },
    },
    version: "2026-08-27",
  };

  const result = await deleteUser({ id: "usr_1" }, context);
  expect(result).toEqual({ id: "usr_1", success: true });
  expect(mockPrisma.user.delete).toHaveBeenCalledOnce();
});

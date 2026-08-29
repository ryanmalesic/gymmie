import { expect, test, vi } from "vitest";

import listUsers, { spec } from "@/domain/users/commands/list.command";
import { type CommandContext } from "@/lib/commands/types";
import { type PrismaClient } from "@/lib/generated/prisma/client";

test("listUsers command spec and execution", async () => {
  expect(spec.name).toBe("ListUsers");

  const now = new Date();
  const users = [
    {
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
    },
  ];
  const mockPrisma = {
    user: {
      count: vi.fn().mockResolvedValue(1),
      findMany: vi.fn().mockResolvedValue(users),
    },
  };

  const context: CommandContext = {
    commandName: "ListUsers",
    prisma: mockPrisma as unknown as PrismaClient,
    session: {
      session: { expiresAt: new Date(), id: "s1" },
      user: { email: "ada@example.com", id: "usr_1" },
    },
    version: "2026-08-27",
  };

  const result = await listUsers({ page: 1, pageSize: 20 }, context);
  expect(result.users).toHaveLength(1);
  expect(result.totalCount).toBe(1);
  expect(mockPrisma.user.findMany).toHaveBeenCalledOnce();
});

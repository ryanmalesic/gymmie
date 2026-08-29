import { expect, test, vi } from "vitest";

import createUser, { spec } from "@/domain/users/commands/create.command";
import { type CommandContext } from "@/lib/commands/types";
import { type PrismaClient } from "@/lib/generated/prisma/client";

test("createUser command spec and execution", async () => {
  expect(spec.name).toBe("CreateUser");
  expect(spec.version).toBe("2026-08-27");

  const now = new Date();
  const mockUser = {
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

  const mockPrisma = {
    user: {
      create: vi.fn().mockResolvedValue(mockUser),
    },
  };

  const context: CommandContext = {
    commandName: "CreateUser",
    prisma: mockPrisma as unknown as PrismaClient,
    session: {
      session: { expiresAt: now, id: "s1" },
      user: { email: "ada@example.com", id: "usr_1" },
    },
    version: "2026-08-28",
  };

  const result = await createUser(
    { email: "ada@example.com", name: "Ada" },
    context,
  );
  expect(result.email).toBe("ada@example.com");
  expect(mockPrisma.user.create).toHaveBeenCalledOnce();
});

test("createUser authorize requires a session user id", () => {
  const input = { email: "ada@example.com", name: "Ada" };

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

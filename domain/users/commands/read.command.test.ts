import { expect, test } from "vitest";

import readUser, { spec } from "@/domain/users/commands/read.command";
import { type CommandContext } from "@/lib/commands/types";
import { type PrismaClient } from "@/lib/generated/prisma/client";

test("readUser command spec and execution", async () => {
  expect(spec.name).toBe("ReadUser");

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

  const context = {
    commandName: "ReadUser",
    prisma: {} as PrismaClient,
    record: user,
    session: {
      session: { expiresAt: now, id: "s1" },
      user: { email: "ada@example.com", id: "usr_1" },
    },
    version: "2026-08-28",
  } as CommandContext<typeof user>;

  const result = await readUser({ id: "usr_1" }, context);
  expect(result.id).toBe("usr_1");
  expect(result).toEqual(user);
});

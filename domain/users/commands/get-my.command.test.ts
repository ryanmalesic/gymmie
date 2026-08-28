import { expect, test } from "vitest";

import getMyUser, { spec } from "@/domain/users/commands/get-my.command";
import { type CommandContext } from "@/lib/commands/types";
import { type PrismaClient } from "@/lib/generated/prisma/client";

test("getMyUser command spec and execution", async () => {
  expect(spec.name).toBe("GetMyUser");

  const user = {
    createdAt: new Date(),
    email: "ada@example.com",
    emailVerified: false,
    id: "usr_1",
    image: null,
    name: "Ada",
    updatedAt: new Date(),
  };

  const context = {
    commandName: "GetMyUser",
    prisma: {} as PrismaClient,
    record: user,
    session: {
      session: { expiresAt: new Date(), id: "s1" },
      user: { email: "ada@example.com", id: "usr_1" },
    },
    version: "2026-08-28",
  } as CommandContext<typeof user>;

  const result = await getMyUser({}, context);
  expect(result).toEqual({
    createdAt: user.createdAt,
    email: user.email,
    id: user.id,
    name: user.name,
    updatedAt: user.updatedAt,
  });
});

test("getMyUser authorize allows only the session user", () => {
  const record = {
    createdAt: new Date(),
    email: "ada@example.com",
    emailVerified: false,
    id: "usr_1",
    image: null,
    name: "Ada",
    updatedAt: new Date(),
  };

  expect(
    spec.authorize(
      { email: "ada@example.com", id: "usr_1" },
      {},
      record,
      {} as PrismaClient,
    ),
  ).toBe(true);
  expect(
    spec.authorize(
      { email: "other@example.com", id: "usr_other" },
      {},
      record,
      {} as PrismaClient,
    ),
  ).toBe(false);
});

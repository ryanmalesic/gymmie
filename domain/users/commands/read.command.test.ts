import { expect, test } from "vitest";

import readUser, { spec } from "@/domain/users/commands/read.command";
import { type CommandContext } from "@/lib/commands/types";
import { type PrismaClient } from "@/lib/generated/prisma/client";

test("readUser command spec and execution", async () => {
  expect(spec.name).toBe("ReadUser");

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
    commandName: "ReadUser",
    prisma: {} as PrismaClient,
    record: user,
    session: {
      session: { expiresAt: new Date(), id: "s1" },
      user: { email: "ada@example.com", id: "usr_1" },
    },
    version: "2026-08-27",
  } as CommandContext<typeof user>;

  const result = await readUser({ id: "usr_1" }, context);
  expect(result.id).toBe("usr_1");
});

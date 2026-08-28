import { expect, test, vi } from "vitest";

import readUser, { spec } from "@/domain/users/commands/read.command";
import { type CommandContext } from "@/lib/commands/types";
import { type PrismaClient } from "@/lib/generated/prisma/client";

test("readUser command spec and execution", async () => {
  expect(spec.name).toBe("readUser");

  const mockPrisma = {
    user: {
      findUnique: vi.fn().mockResolvedValue({
        createdAt: new Date(),
        email: "ada@example.com",
        id: "usr_1",
        name: "Ada",
        updatedAt: new Date(),
      }),
    },
  };

  const context: CommandContext = {
    commandName: "readUser",
    prisma: mockPrisma as unknown as PrismaClient,
    session: {
      session: { expiresAt: new Date(), id: "s1" },
      user: { email: "ada@example.com", id: "usr_1" },
    },
    version: "2026-08-27",
  };

  const result = await readUser({ id: "usr_1" }, context);
  expect(result.id).toBe("usr_1");
  expect(mockPrisma.user.findUnique).toHaveBeenCalledOnce();
});

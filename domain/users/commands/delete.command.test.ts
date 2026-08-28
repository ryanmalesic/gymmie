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

  const user = {
    createdAt: new Date(),
    email: "ada@example.com",
    emailVerified: false,
    id: "usr_1",
    image: null,
    name: "Ada",
    updatedAt: new Date(),
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

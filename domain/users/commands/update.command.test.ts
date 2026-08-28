import { expect, test, vi } from "vitest";

import updateUser, { spec } from "@/domain/users/commands/update.command";
import { type CommandContext } from "@/lib/commands/types";
import { type PrismaClient } from "@/lib/generated/prisma/client";

test("updateUser command spec and execution", async () => {
  expect(spec.name).toBe("updateUser");

  const mockPrisma = {
    user: {
      update: vi.fn().mockResolvedValue({
        createdAt: new Date(),
        email: "ada@example.com",
        id: "usr_1",
        name: "Ada Updated",
        updatedAt: new Date(),
      }),
    },
  };

  const context: CommandContext = {
    commandName: "updateUser",
    prisma: mockPrisma as unknown as PrismaClient,
    session: {
      session: { expiresAt: new Date(), id: "s1" },
      user: { email: "ada@example.com", id: "usr_1" },
    },
    version: "2026-08-27",
  };

  const result = await updateUser(
    { id: "usr_1", name: "Ada Updated" },
    context,
  );
  expect(result.name).toBe("Ada Updated");
  expect(mockPrisma.user.update).toHaveBeenCalledOnce();
});

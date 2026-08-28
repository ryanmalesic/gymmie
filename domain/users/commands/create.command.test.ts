import { expect, test, vi } from "vitest";

import createUser, { spec } from "@/domain/users/commands/create.command";
import { type CommandContext } from "@/lib/commands/types";
import { type PrismaClient } from "@/lib/generated/prisma/client";

test("createUser command spec and execution", async () => {
  expect(spec.name).toBe("createUser");
  expect(spec.version).toBe("2026-08-27");

  const mockPrisma = {
    user: {
      create: vi.fn().mockResolvedValue({
        createdAt: new Date(),
        email: "ada@example.com",
        id: "usr_1",
        name: "Ada",
      }),
    },
  };

  const context: CommandContext = {
    commandName: "createUser",
    prisma: mockPrisma as unknown as PrismaClient,
    session: {
      session: { expiresAt: new Date(), id: "s1" },
      user: { email: "ada@example.com", id: "usr_1" },
    },
    version: "2026-08-27",
  };

  const result = await createUser(
    { email: "ada@example.com", name: "Ada" },
    context,
  );
  expect(result.email).toBe("ada@example.com");
  expect(mockPrisma.user.create).toHaveBeenCalledOnce();
});

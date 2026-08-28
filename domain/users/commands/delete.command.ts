import "server-only";

import { defineCommand, type InferCommand } from "@/lib/commands/base";
import { z } from "@/lib/zod";

const requestSchema = z
  .object({
    id: z.string().min(1).openapi({ description: "Target user ID to delete" }),
  })
  .strict()
  .openapi("DeleteUserRequest");

const responseSchema = z
  .object({
    id: z.string().min(1),
    success: z.boolean(),
  })
  .strict()
  .openapi("DeleteUserResponse");

export const spec = defineCommand({
  authorize: (user, input) => user.id === input.id,
  name: "deleteUser",
  spec: {
    description: "Deletes a user record. Allowed for account owner.",
    request: { description: "Target user ID", schema: requestSchema },
    response: {
      description: "Deletion status",
      schema: responseSchema,
      status: 200,
    },
    summary: "Delete user",
    tags: ["Users"],
  },
  version: "2026-08-27",
});

const deleteUser: InferCommand<typeof spec> = async (input, { prisma }) => {
  await prisma.user.delete({ where: { id: input.id } });
  return { id: input.id, success: true };
};

export default deleteUser;

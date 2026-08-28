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
  load: {
    entity: "User",
    fetch: (_user, input, prisma) =>
      prisma.user.findUnique({ where: { id: input.id } }),
  },
  authorize: (user, _input, record) => record.id === user.id,
  name: "DeleteUser",
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
});

const deleteUser: InferCommand<typeof spec> = async (input, { prisma }) => {
  await prisma.user.delete({ where: { id: input.id } });
  return { id: input.id, success: true };
};

export default deleteUser;

import "server-only";

import { defineCommand, type InferCommand } from "@/lib/commands/base";
import { UserSchema } from "@/lib/generated/zod/modelSchema/UserSchema";
import { z } from "@/lib/zod";

const requestSchema = UserSchema.pick({ name: true })
  .extend({
    id: z.string().min(1).openapi({ description: "Target user ID" }),
  })
  .strict()
  .openapi("UpdateUserRequest");

const responseSchema = UserSchema.pick({
  createdAt: true,
  email: true,
  id: true,
  name: true,
  updatedAt: true,
})
  .strict()
  .openapi("UpdateUserResponse");

export const spec = defineCommand({
  load: {
    entity: "User",
    fetch: (_user, input, prisma) =>
      prisma.user.findUnique({ where: { id: input.id } }),
  },
  authorize: (user, _input, record) => record.id === user.id,
  name: "UpdateUser",
  spec: {
    description: "Updates user mutable fields. Allowed for account owner.",
    request: {
      description: "User ID and mutable fields",
      schema: requestSchema,
    },
    response: {
      description: "Updated user record",
      schema: responseSchema,
      status: 200,
    },
    summary: "Update user profile",
    tags: ["Users"],
  },
});

const updateUser: InferCommand<typeof spec> = async (input, { prisma }) => {
  return await prisma.user.update({
    data: { name: input.name },
    select: {
      createdAt: true,
      email: true,
      id: true,
      name: true,
      updatedAt: true,
    },
    where: { id: input.id },
  });
};

export default updateUser;

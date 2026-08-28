import "server-only";

import { defineCommand, type InferCommand } from "@/lib/commands/base";
import { UserSchema } from "@/lib/generated/zod";
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
  authorize: (user, input) => user.id === input.id,
  name: "updateUser",
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
  version: "2026-08-27",
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

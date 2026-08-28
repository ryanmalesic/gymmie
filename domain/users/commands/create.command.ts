import "server-only";

import { defineCommand, type InferCommand } from "@/lib/commands/base";
import { UserSchema } from "@/lib/generated/zod";

const requestSchema = UserSchema.pick({ email: true, name: true })
  .strict()
  .openapi("CreateUserRequest");

const responseSchema = UserSchema.pick({
  createdAt: true,
  email: true,
  id: true,
  name: true,
})
  .strict()
  .openapi("CreateUserResponse");

export const spec = defineCommand({
  authorize: () => true,
  name: "createUser",
  spec: {
    description: "Inserts a new user record. Requires active session.",
    request: { description: "New user payload", schema: requestSchema },
    response: {
      description: "Created user record",
      schema: responseSchema,
      status: 201,
    },
    summary: "Create a new user",
    tags: ["Users"],
  },
  version: "2026-08-27",
});

const createUser: InferCommand<typeof spec> = async (input, { prisma }) => {
  return await prisma.user.create({
    data: {
      email: input.email,
      emailVerified: false,
      name: input.name,
    },
    select: { createdAt: true, email: true, id: true, name: true },
  });
};

export default createUser;

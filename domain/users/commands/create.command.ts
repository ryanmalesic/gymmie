import "server-only";

import { createUserSchema, userSchema } from "@/domain/users/schema";
import { defineCommand, type InferCommand } from "@/lib/commands/base";

const requestSchema = createUserSchema;
const responseSchema = userSchema;

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
  });
};

export default createUser;

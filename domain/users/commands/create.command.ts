import "server-only";

import { createUserSchema, parseUser, userSchema } from "@/domain/users/schema";
import { defineCommand, type InferCommand } from "@/lib/commands/base";

const requestSchema = createUserSchema;
const responseSchema = userSchema;

export const spec = defineCommand({
  authorize: (user) => Boolean(user.id),
  name: "CreateUser",
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
});

const createUser: InferCommand<typeof spec> = async (input, { prisma }) => {
  return parseUser(
    await prisma.user.create({
      data: {
        email: input.email,
        emailVerified: false,
        name: input.name,
      },
    }),
  );
};

export default createUser;

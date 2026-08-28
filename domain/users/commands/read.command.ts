import "server-only";

import { defineCommand, type InferCommand } from "@/lib/commands/base";
import { NotFoundError } from "@/lib/commands/errors";
import { UserSchema } from "@/lib/generated/zod/modelSchema/UserSchema";
import { z } from "@/lib/zod";

const requestSchema = z
  .object({
    id: z.string().min(1).openapi({ description: "Target user ID" }),
  })
  .strict()
  .openapi("ReadUserRequest");

const responseSchema = UserSchema.pick({
  createdAt: true,
  email: true,
  id: true,
  name: true,
  updatedAt: true,
})
  .strict()
  .openapi("ReadUserResponse");

export const spec = defineCommand({
  authorize: (user, input) => user.id === input.id || true,
  name: "readUser",
  spec: {
    description: "Fetches user details. Accessible by authenticated users.",
    request: { description: "Target user ID", schema: requestSchema },
    response: {
      description: "User record",
      schema: responseSchema,
      status: 200,
    },
    summary: "Fetch user by ID",
    tags: ["Users"],
  },
  version: "2026-08-27",
});

const readUser: InferCommand<typeof spec> = async (input, { prisma }) => {
  const user = await prisma.user.findUnique({
    select: {
      createdAt: true,
      email: true,
      id: true,
      name: true,
      updatedAt: true,
    },
    where: { id: input.id },
  });

  if (!user) {
    throw new NotFoundError("User", input.id);
  }

  return user;
};

export default readUser;

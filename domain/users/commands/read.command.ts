import "server-only";

import { defineCommand, type InferCommand } from "@/lib/commands/base";
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
  load: {
    entity: "User",
    fetch: (_user, input, prisma) =>
      prisma.user.findUnique({ where: { id: input.id } }),
  },
  authorize: () => true,
  name: "ReadUser",
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
});

const readUser: InferCommand<typeof spec> = async (_input, { record }) => {
  return {
    createdAt: record.createdAt,
    email: record.email,
    id: record.id,
    name: record.name,
    updatedAt: record.updatedAt,
  };
};

export default readUser;

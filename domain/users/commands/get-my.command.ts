import "server-only";

import { defineCommand, type InferCommand } from "@/lib/commands/base";
import { UserSchema } from "@/lib/generated/zod/modelSchema/UserSchema";
import { z } from "@/lib/zod";

const requestSchema = z.object({}).strict().openapi("GetMyUserRequest");

const responseSchema = UserSchema.pick({
  createdAt: true,
  email: true,
  id: true,
  name: true,
  updatedAt: true,
})
  .strict()
  .openapi("GetMyUserResponse");

export const spec = defineCommand({
  load: {
    entity: "User",
    fetch: (user, _input, prisma) =>
      prisma.user.findUnique({ where: { id: user.id } }),
  },
  authorize: (user, _input, record) => record.id === user.id,
  name: "GetMyUser",
  spec: {
    description: "Fetches the current authenticated user.",
    request: { description: "Empty payload", schema: requestSchema },
    response: {
      description: "Current user record",
      schema: responseSchema,
      status: 200,
    },
    summary: "Fetch the current user",
    tags: ["Users"],
  },
  version: "2026-08-28",
});

const getMyUser: InferCommand<typeof spec> = async (_input, { record }) => {
  return {
    createdAt: record.createdAt,
    email: record.email,
    id: record.id,
    name: record.name,
    updatedAt: record.updatedAt,
  };
};

export default getMyUser;

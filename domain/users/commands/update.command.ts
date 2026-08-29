import "server-only";

import { parseUser, UserSchema } from "@/domain/users/schema";
import { defineCommand, type InferCommand } from "@/lib/commands/base";
import { z } from "@/lib/zod";

const requestSchema = UserSchema.pick({
  addressLine1: true,
  addressLine2: true,
  city: true,
  country: true,
  latitude: true,
  longitude: true,
  name: true,
  phone: true,
  postalCode: true,
  state: true,
  timezone: true,
})
  .partial()
  .extend({
    id: z.string().min(1).openapi({ description: "Target user ID" }),
  })
  .strict()
  .openapi("UpdateUserRequest");

const responseSchema = UserSchema.strict().openapi("UpdateUserResponse");

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
  const { id, ...data } = input;
  return parseUser(
    await prisma.user.update({
      data,
      where: { id },
    }),
  );
};

export default updateUser;

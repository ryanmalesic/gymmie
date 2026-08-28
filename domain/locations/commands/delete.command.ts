import "server-only";

import { defineCommand, type InferCommand } from "@/lib/commands/base";
import { z } from "@/lib/zod";

const requestSchema = z
  .object({
    id: z
      .string()
      .min(1)
      .openapi({ description: "Target location ID to delete" }),
  })
  .strict()
  .openapi("DeleteLocationRequest");

const responseSchema = z
  .object({
    id: z.string().min(1),
    success: z.boolean(),
  })
  .strict()
  .openapi("DeleteLocationResponse");

export const spec = defineCommand({
  load: {
    entity: "Location",
    fetch: (_user, input, prisma) =>
      prisma.location.findUnique({ where: { id: input.id } }),
  },
  authorize: (user, _input, location) => location.ownerId === user.id,
  name: "DeleteLocation",
  spec: {
    description: "Deletes a location. Allowed for the location owner.",
    request: { description: "Target location ID", schema: requestSchema },
    response: {
      description: "Deletion status",
      schema: responseSchema,
      status: 200,
    },
    summary: "Delete a location",
    tags: ["Locations"],
  },
  version: "2026-08-28",
});

const deleteLocation: InferCommand<typeof spec> = async (input, { prisma }) => {
  await prisma.location.delete({ where: { id: input.id } });
  return { id: input.id, success: true };
};

export default deleteLocation;

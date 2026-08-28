import "server-only";

import {
  locationSchema,
  parseLocation,
  updateLocationSchema,
} from "@/domain/locations/schema";
import { defineCommand, type InferCommand } from "@/lib/commands/base";
import { z } from "@/lib/zod";

const requestSchema = updateLocationSchema
  .extend({
    id: z.string().min(1).openapi({ description: "Target location ID" }),
  })
  .strict()
  .openapi("UpdateLocationRequest");

const responseSchema = locationSchema;

export const spec = defineCommand({
  load: {
    entity: "Location",
    fetch: (_user, input, prisma) =>
      prisma.location.findUnique({ where: { id: input.id } }),
  },
  authorize: (user, _input, location) => location.ownerId === user.id,
  name: "UpdateLocation",
  spec: {
    description: "Updates location fields. Allowed for the location owner.",
    request: {
      description: "Location ID and mutable fields",
      schema: requestSchema,
    },
    response: {
      description: "Updated location record",
      schema: responseSchema,
      status: 200,
    },
    summary: "Update a location",
    tags: ["Locations"],
  },
  version: "2026-08-28",
});

const updateLocation: InferCommand<typeof spec> = async (input, { prisma }) => {
  const { id, ...data } = input;
  return parseLocation(
    await prisma.location.update({
      data,
      where: { id },
    }),
  );
};

export default updateLocation;

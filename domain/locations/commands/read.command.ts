import "server-only";

import { locationSchema, parseLocation } from "@/domain/locations/schema";
import { defineCommand, type InferCommand } from "@/lib/commands/base";
import { z } from "@/lib/zod";

const requestSchema = z
  .object({
    id: z.string().min(1).openapi({ description: "Target location ID" }),
  })
  .strict()
  .openapi("ReadLocationRequest");

const responseSchema = locationSchema;

export const spec = defineCommand({
  load: {
    entity: "Location",
    fetch: (_user, input, prisma) =>
      prisma.location.findUnique({ where: { id: input.id } }),
  },
  authorize: () => true,
  name: "ReadLocation",
  spec: {
    description: "Fetches a location by ID. Accessible by authenticated users.",
    request: { description: "Target location ID", schema: requestSchema },
    response: {
      description: "Location record",
      schema: responseSchema,
      status: 200,
    },
    summary: "Fetch location by ID",
    tags: ["Locations"],
  },
  version: "2026-08-28",
});

const readLocation: InferCommand<typeof spec> = async (_input, { record }) => {
  return parseLocation(record);
};

export default readLocation;

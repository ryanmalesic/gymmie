import "server-only";

import { locationSchema, parseLocation } from "@/domain/locations/schema";
import { defineCommand, type InferCommand } from "@/lib/commands/base";
import { WireInt, z } from "@/lib/zod";

const requestSchema = z
  .object({
    page: WireInt(1, 1000).default(1),
    pageSize: WireInt(1, 100, 20).default(20),
  })
  .strict()
  .openapi("ListMyLocationsRequest");

const responseSchema = z
  .object({
    locations: z.array(locationSchema),
    page: z.number().int(),
    pageSize: z.number().int(),
    totalCount: z.number().int().min(0),
  })
  .strict()
  .openapi("ListMyLocationsResponse");

export const spec = defineCommand({
  authorize: () => true,
  name: "ListMyLocations",
  spec: {
    description: "Lists locations owned by the current user.",
    request: { description: "Pagination", schema: requestSchema },
    response: {
      description: "Paginated locations owned by the current user",
      schema: responseSchema,
      status: 200,
    },
    summary: "List my locations",
    tags: ["Locations"],
  },
  version: "2026-08-28",
});

const listMyLocations: InferCommand<typeof spec> = async (
  input,
  { prisma, session },
) => {
  const skip = (input.page - 1) * input.pageSize;
  const where = { ownerId: session.user.id };

  const [locations, totalCount] = await Promise.all([
    prisma.location.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: input.pageSize,
      where,
    }),
    prisma.location.count({ where }),
  ]);

  return {
    locations: locations.map((location) => parseLocation(location)),
    page: input.page,
    pageSize: input.pageSize,
    totalCount,
  };
};

export default listMyLocations;

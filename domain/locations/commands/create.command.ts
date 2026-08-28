import "server-only";

import {
  createLocationSchema,
  locationSchema,
  parseLocation,
} from "@/domain/locations/schema";
import { defineCommand, type InferCommand } from "@/lib/commands/base";

const requestSchema = createLocationSchema;
const responseSchema = locationSchema;

export const spec = defineCommand({
  authorize: (user) => Boolean(user.id),
  name: "CreateLocation",
  spec: {
    description:
      "Creates a location owned by the current user. Allowed for the owner.",
    request: { description: "New location payload", schema: requestSchema },
    response: {
      description: "Created location record",
      schema: responseSchema,
      status: 201,
    },
    summary: "Create a location",
    tags: ["Locations"],
  },
  version: "2026-08-28",
});

const createLocation: InferCommand<typeof spec> = async (
  input,
  { prisma, session },
) => {
  return parseLocation(
    await prisma.location.create({
      data: {
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2,
        city: input.city,
        country: input.country,
        email: input.email,
        latitude: input.latitude,
        longitude: input.longitude,
        name: input.name,
        ownerId: session.user.id,
        phone: input.phone,
        postalCode: input.postalCode,
        state: input.state,
        status: input.status,
        timezone: input.timezone,
        type: input.type,
        website: input.website,
      },
    }),
  );
};

export default createLocation;

import {
  type Location,
  LocationSchema,
} from "@/lib/generated/zod/modelSchema/LocationSchema";
import { type z } from "@/lib/zod";

export const locationSchema = LocationSchema;
export const createLocationSchema = locationSchema
  .omit({
    createdAt: true,
    id: true,
    ownerId: true,
    updatedAt: true,
  })
  .extend({
    addressLine2: locationSchema.shape.addressLine2.optional(),
    country: locationSchema.shape.country.optional(),
    status: locationSchema.shape.status.optional(),
    timezone: locationSchema.shape.timezone.optional(),
  })
  .strict();
export const updateLocationSchema = locationSchema
  .omit({
    createdAt: true,
    id: true,
    ownerId: true,
    updatedAt: true,
  })
  .partial();

export type CreateLocation = z.infer<typeof createLocationSchema>;
export type UpdateLocation = z.infer<typeof updateLocationSchema>;
export type { Location };

export function parseLocation(value: unknown) {
  return locationSchema.parse(value);
}

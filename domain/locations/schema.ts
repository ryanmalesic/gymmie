import { LocationCreateWithoutOwnerInputSchema } from "@/lib/generated/zod/inputTypeSchemas/LocationCreateWithoutOwnerInputSchema";
import {
  type Location,
  LocationSchema,
} from "@/lib/generated/zod/modelSchema/LocationSchema";
import { type z } from "@/lib/zod";

export const createLocationSchema =
  LocationCreateWithoutOwnerInputSchema as z.ZodType<
    z.infer<typeof LocationCreateWithoutOwnerInputSchema>,
    z.infer<typeof LocationCreateWithoutOwnerInputSchema>
  >;
export const locationSchema = LocationSchema;

export type CreateLocation = z.infer<typeof createLocationSchema>;
export type { Location };

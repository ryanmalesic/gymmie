import { UserCreateManyInputSchema } from "@/lib/generated/zod/inputTypeSchemas/UserCreateManyInputSchema";
import {
  type User,
  UserSchema,
} from "@/lib/generated/zod/modelSchema/UserSchema";
import { type z } from "@/lib/zod";

export const createUserSchema = UserCreateManyInputSchema as z.ZodType<
  z.infer<typeof UserCreateManyInputSchema>,
  z.infer<typeof UserCreateManyInputSchema>
>;
export const userSchema = UserSchema;
export { UserSchema };
export const updateUserSchema = UserSchema.pick({
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
}).partial();

export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type { User };

export function parseUser(value: unknown): User {
  return userSchema.parse(value);
}

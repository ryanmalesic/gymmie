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

export type CreateUser = z.infer<typeof createUserSchema>;
export type { User };

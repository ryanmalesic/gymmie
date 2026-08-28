import { UserSchema } from "@/lib/generated/zod";
import { type z } from "@/lib/zod";

export const userSchema = UserSchema.pick({
  email: true,
  id: true,
  name: true,
});
export const createUserSchema = UserSchema.pick({ email: true, name: true });

export type CreateUser = z.infer<typeof createUserSchema>;
export type User = z.infer<typeof userSchema>;

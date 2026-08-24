import { type z } from "zod";

import { type ActionError } from "@/lib/action";
import { UserSchema } from "@/lib/prisma/generated/zod/schemas";

export const userSchema = UserSchema.pick({
  email: true,
  id: true,
  name: true,
});
export const createUserSchema = UserSchema.pick({ email: true, name: true });

export type CreateUser = z.infer<typeof createUserSchema>;
export type User = z.infer<typeof userSchema>;

export const createUserFailure = {
  form: ["Unable to create user"],
} satisfies ActionError<CreateUser>;

export const loadUsersFailure = {
  form: ["Unable to load users"],
} satisfies ActionError;

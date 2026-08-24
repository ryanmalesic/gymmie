import { type z } from "zod";

import { UserSchema } from "@/lib/prisma/generated/zod/schemas";

export const listedUserSchema = UserSchema.pick({
  email: true,
  id: true,
  name: true,
});
export const userInputSchema = UserSchema.pick({ email: true, name: true });

export type ListedUser = z.infer<typeof listedUserSchema>;
export type UserInput = z.infer<typeof userInputSchema>;

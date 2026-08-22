import { type z } from "zod";

import { UserSchema } from "@/lib/prisma/generated/zod/schemas";

export const userInputSchema = UserSchema.pick({ email: true, name: true });

export type UserInput = z.infer<typeof userInputSchema>;

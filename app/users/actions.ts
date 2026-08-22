"use server";

import { revalidatePath } from "next/cache";
import { flattenError } from "zod";

import { type ActionResult, fromPrismaError } from "@/lib/action";
import { createUser, listUsers } from "@/lib/users/repository";
import { type UserInput, userInputSchema } from "@/lib/users/schema";

type AddUserResult = Awaited<ReturnType<typeof createUser>>;
type FetchUsersResult = Awaited<ReturnType<typeof listUsers>>;

export async function addUser(
  input: UserInput,
): Promise<ActionResult<AddUserResult, UserInput>> {
  const parsed = userInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      error: flattenError(parsed.error).fieldErrors,
      ok: false,
      values: input,
    };
  }

  try {
    const user = await createUser(parsed.data);

    revalidatePath("/");

    return { data: user, ok: true };
  } catch (error) {
    return {
      ...fromPrismaError<UserInput>(
        error,
        { form: ["Unable to create user"] },
        {
          P2002: { email: ["Email is already taken"] },
        },
      ),
      values: input,
    };
  }
}

export async function fetchUsers(): Promise<ActionResult<FetchUsersResult>> {
  try {
    return { data: await listUsers(), ok: true };
  } catch (error) {
    return fromPrismaError(error, { form: ["Unable to load users"] });
  }
}

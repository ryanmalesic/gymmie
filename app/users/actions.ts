"use server";

import { revalidatePath } from "next/cache";
import { flattenError } from "zod";

import { type ActionResult, fromPrismaError } from "@/lib/action";
import { createUser, listUsers } from "@/lib/users/repository";
import { type UserInput, userInputSchema } from "@/lib/users/schema";

type CreateUserResult = Awaited<ReturnType<typeof createUser>>;
type ListUsersResult = Awaited<ReturnType<typeof listUsers>>;

export async function createUserAction(
  _prevState: ActionResult<CreateUserResult, UserInput>,
  formData: FormData,
): Promise<ActionResult<CreateUserResult, UserInput>> {
  const values = {
    email: String(formData.get("email") ?? ""),
    name: String(formData.get("name") ?? ""),
  };

  const parsed = userInputSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: flattenError(parsed.error).fieldErrors,
      ok: false,
      values,
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
      values,
    };
  }
}

export async function listUsersAction(): Promise<
  ActionResult<ListUsersResult>
> {
  try {
    return { data: await listUsers(), ok: true };
  } catch (error) {
    return fromPrismaError(error, { form: ["Unable to load users"] });
  }
}

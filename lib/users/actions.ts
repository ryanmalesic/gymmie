"use server";

import { flattenError } from "zod";

import { type ActionResult } from "@/lib/action";
import { fromActionError, reportRecoverablePrismaError } from "@/lib/action";
import { requireSession } from "@/lib/auth/session.server";
import { createUser, listUsers } from "@/lib/users/repository";
import { type UserInput, userInputSchema } from "@/lib/users/schema";

type AddUserResult = Awaited<ReturnType<typeof createUser>>;
type FetchUsersResult = Awaited<ReturnType<typeof listUsers>>;

const CREATE_USER_FAILURE = { form: ["Unable to create user"] };
const LOAD_USERS_FAILURE = { form: ["Unable to load users"] };

export async function addUser(
  input: UserInput,
): Promise<ActionResult<AddUserResult, UserInput>> {
  await requireSession();

  try {
    const parsed = userInputSchema.safeParse(input);

    if (!parsed.success) {
      return {
        error: flattenError(parsed.error).fieldErrors,
        ok: false,
        values: input,
      };
    }

    return { data: await createUser(parsed.data), ok: true };
  } catch (error) {
    reportRecoverablePrismaError(error);
    return {
      ...fromActionError<UserInput>(
        error,
        {
          P2002: { email: ["Email is already taken"] },
          P2024: CREATE_USER_FAILURE,
        },
        CREATE_USER_FAILURE,
      ),
      values: input,
    };
  }
}

/**
 * Authentication is enforced by requireSession and redirects before the
 * ActionResult boundary. Repository and validation failures resolve safely.
 */
export async function fetchUsers(): Promise<
  ActionResult<FetchUsersResult, UserInput>
> {
  await requireSession();

  try {
    return { data: await listUsers(), ok: true };
  } catch (error) {
    reportRecoverablePrismaError(error);
    return fromActionError<UserInput>(
      error,
      { P2024: LOAD_USERS_FAILURE },
      LOAD_USERS_FAILURE,
    );
  }
}

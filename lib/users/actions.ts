"use server";

import { flattenError } from "zod";

import {
  type ActionResult,
  fromError,
  reportRecoverablePrismaError,
} from "@/lib/action";
import { requireSession } from "@/lib/auth/session.server";
import { createUser, listUsers } from "@/lib/users/repository";
import {
  type CreateUser,
  createUserFailure,
  createUserSchema,
  loadUsersFailure,
  type User,
} from "@/lib/users/schema";

export async function addUser(
  input: CreateUser,
): Promise<ActionResult<User, CreateUser>> {
  await requireSession();

  try {
    const parsed = createUserSchema.safeParse(input);

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
      ...fromError<CreateUser>(
        error,
        {
          P2002: { email: ["Email is already taken"] },
          P2024: createUserFailure,
        },
        createUserFailure,
      ),
      values: input,
    };
  }
}

/**
 * Authentication is enforced by requireSession and redirects before the
 * ActionResult boundary. Repository and validation failures resolve safely.
 */
export async function fetchUsers(): Promise<ActionResult<User[]>> {
  await requireSession();

  try {
    return { data: await listUsers(), ok: true };
  } catch (error) {
    reportRecoverablePrismaError(error);
    return fromError(error, { P2024: loadUsersFailure }, loadUsersFailure);
  }
}

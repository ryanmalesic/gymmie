import { Prisma } from "@/lib/prisma/generated/client";

export type ActionError<T> = FieldErrors<T> & { form?: string[] };

export type ActionFailure<I> = {
  error: ActionError<I>;
  ok: false;
  values?: I;
};

export type ActionResult<T, I = object> =
  ActionFailure<I> | { data: T; ok: true };

export type FieldErrors<T> = {
  [K in keyof T]?: string[];
};

export function fromPrismaError<I = object>(
  error: unknown,
  fallback: ActionError<I>,
  codes: Record<string, ActionError<I>> = {},
): ActionFailure<I> {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return { error: codes[error.code] ?? fallback, ok: false };
  }

  throw error;
}

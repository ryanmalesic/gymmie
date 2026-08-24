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

export function fromActionError<I = object>(
  error: unknown,
  codes: Record<string, ActionError<I>>,
  fallback: ActionError<I>,
): ActionFailure<I> {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const actionError = codes[error.code];
    if (actionError) {
      return { error: actionError, ok: false };
    }
  }

  return { error: fallback, ok: false };
}

export function isActionFailure<I>(value: unknown): value is ActionFailure<I> {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as { error?: unknown; ok?: unknown };
  return (
    candidate.ok === false &&
    typeof candidate.error === "object" &&
    candidate.error !== null
  );
}

export function reportRecoverablePrismaError(error: unknown): void {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2024"
  ) {
    console.error("Recoverable Prisma availability error", error);
  }
}

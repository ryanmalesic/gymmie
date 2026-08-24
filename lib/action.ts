export type ActionError<T = object> = FieldErrors<T> & { form?: string[] };

export type ActionFailure<I = object> = {
  error: ActionError<I>;
  ok: false;
  values?: I;
};

export type ActionResult<T, I = object> =
  ActionFailure<I> | { data: T; ok: true };

export type FieldErrors<T> = {
  [K in keyof T]?: string[];
};

export function fromError<I = object>(
  error: unknown,
  codes: Record<string, ActionError<I>>,
  fallback: ActionError<I>,
): ActionFailure<I> {
  if (isNextControlFlowError(error)) {
    throw error;
  }

  if (isActionFailure<I>(error)) {
    return error;
  }

  const prismaCode = prismaKnownRequestCode(error);
  if (prismaCode) {
    const actionError = codes[prismaCode];
    if (actionError) {
      return { error: actionError, ok: false };
    }
  }

  return { error: fallback, ok: false };
}

export function reportRecoverablePrismaError(error: unknown): void {
  if (prismaKnownRequestCode(error) === "P2024") {
    console.error("Recoverable Prisma availability error", error);
  }
}

function isActionFailure<I>(value: unknown): value is ActionFailure<I> {
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

function isNextControlFlowError(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("digest" in error)) {
    return false;
  }

  const digest = error.digest;
  return (
    typeof digest === "string" &&
    (digest.startsWith("NEXT_REDIRECT") ||
      digest.startsWith("NEXT_NOT_FOUND") ||
      digest.startsWith("NEXT_HTTP_ERROR_FALLBACK"))
  );
}

function prismaKnownRequestCode(error: unknown): string | undefined {
  if (
    typeof error !== "object" ||
    error === null ||
    !("clientVersion" in error) ||
    !("code" in error) ||
    typeof error.code !== "string"
  ) {
    return undefined;
  }

  return error.code;
}

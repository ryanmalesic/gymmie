import { type ErrorCode } from "@/lib/commands/types";

export class CommandError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly status: number = 400,
    public readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ConflictError extends CommandError {
  constructor(message: string, fieldErrors?: Record<string, string[]>) {
    super(message, "CONFLICT", 409, fieldErrors);
  }
}

export class ForbiddenError extends CommandError {
  constructor(userId: string, commandName: string) {
    super(
      `User '${userId}' failed authorization policy for '${commandName}'.`,
      "FORBIDDEN",
      403,
    );
  }
}

export class InternalError extends CommandError {
  constructor(message = "An unexpected error occurred.") {
    super(message, "INTERNAL_ERROR", 500);
  }
}

export class NotFoundError extends CommandError {
  constructor(entity: string, id: string) {
    super(`${entity} with ID '${id}' not found.`, "NOT_FOUND", 404);
  }
}

export class SchemaValidationError extends CommandError {
  constructor(
    details: string,
    type: "REQUEST" | "RESPONSE",
    fieldErrors?: Record<string, string[]>,
  ) {
    super(
      `[${type}_SCHEMA_VIOLATION] ${details}`,
      "SCHEMA_VALIDATION_FAILED",
      422,
      fieldErrors,
    );
  }
}

export class UnauthenticatedError extends CommandError {
  constructor(message = "Active session required.") {
    super(message, "UNAUTHENTICATED", 401);
  }
}

export function toErrorResponse(error: unknown): {
  code: ErrorCode;
  error: string;
  fieldErrors?: Record<string, string[]>;
  status: number;
  success: false;
} {
  if (error instanceof CommandError) {
    return {
      code: error.code,
      error: error.message,
      fieldErrors: error.fieldErrors,
      status: error.status,
      success: false,
    };
  }

  const message =
    error instanceof Error ? error.message : "An unexpected error occurred.";

  return {
    code: "INTERNAL_ERROR",
    error: message,
    status: 500,
    success: false,
  };
}

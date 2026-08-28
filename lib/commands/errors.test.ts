import { expect, test } from "vitest";

import {
  CommandError,
  ConflictError,
  ForbiddenError,
  InternalError,
  NotFoundError,
  SchemaValidationError,
  toErrorResponse,
  UnauthenticatedError,
} from "@/lib/commands/errors";

test("command error subclasses initialize correctly", () => {
  const generic = new CommandError("Generic message", "BAD_REQUEST", 400);
  expect(generic.message).toBe("Generic message");
  expect(generic.code).toBe("BAD_REQUEST");
  expect(generic.status).toBe(400);

  const unauth = new UnauthenticatedError();
  expect(unauth.code).toBe("UNAUTHENTICATED");
  expect(unauth.status).toBe(401);

  const forbidden = new ForbiddenError("u1", "deleteUser");
  expect(forbidden.code).toBe("FORBIDDEN");
  expect(forbidden.status).toBe(403);

  const notFound = new NotFoundError("User", "u1");
  expect(notFound.code).toBe("NOT_FOUND");
  expect(notFound.status).toBe(404);

  const validation = new SchemaValidationError("Invalid", "REQUEST", {
    email: ["Invalid"],
  });
  expect(validation.code).toBe("SCHEMA_VALIDATION_FAILED");
  expect(validation.status).toBe(422);
  expect(validation.fieldErrors?.email).toEqual(["Invalid"]);

  const conflict = new ConflictError("Email exists");
  expect(conflict.code).toBe("CONFLICT");
  expect(conflict.status).toBe(409);

  const internal = new InternalError();
  expect(internal.code).toBe("INTERNAL_ERROR");
  expect(internal.status).toBe(500);
});

test("toErrorResponse formats CommandError and unknown errors", () => {
  const custom = new ConflictError("Email taken", { email: ["Already taken"] });
  const formatted = toErrorResponse(custom);
  expect(formatted).toEqual({
    code: "CONFLICT",
    error: "Email taken",
    fieldErrors: { email: ["Already taken"] },
    status: 409,
    success: false,
  });

  const unknownErr = new Error("Boom");
  expect(toErrorResponse(unknownErr)).toEqual({
    code: "INTERNAL_ERROR",
    error: "Boom",
    status: 500,
    success: false,
  });
});

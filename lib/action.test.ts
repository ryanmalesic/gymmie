import { expect, test } from "vitest";

import { fromPrismaError } from "@/lib/action";
import { Prisma } from "@/lib/prisma/generated/client";

function knownRequestError(code: string) {
  return new Prisma.PrismaClientKnownRequestError("constraint failed", {
    clientVersion: "test",
    code,
  });
}

test("maps a known Prisma code to the matching field error", () => {
  expect(
    fromPrismaError<{ email: string }>(
      knownRequestError("P2002"),
      { form: ["Unable to create user"] },
      { P2002: { email: ["Email is already taken"] } },
    ),
  ).toEqual({
    error: { email: ["Email is already taken"] },
    ok: false,
  });
});

test("uses the fallback for an unmapped Prisma code", () => {
  expect(
    fromPrismaError(knownRequestError("P2025"), {
      form: ["Unable to load users"],
    }),
  ).toEqual({
    error: { form: ["Unable to load users"] },
    ok: false,
  });
});

test("rethrows errors that are not known Prisma request errors", () => {
  const error = new Error("connection refused");
  expect(() =>
    fromPrismaError(error, { form: ["Unable to load users"] }),
  ).toThrow(error);
});

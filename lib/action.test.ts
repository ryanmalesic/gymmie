import { expect, test } from "vitest";

import { fromError } from "@/lib/action";
import { Prisma } from "@/lib/prisma/generated/client";

function knownRequestError(code: string) {
  return new Prisma.PrismaClientKnownRequestError("constraint failed", {
    clientVersion: "test",
    code,
  });
}

test("maps an explicitly handled Prisma code", () => {
  expect(
    fromError<{ email: string }>(
      knownRequestError("P2002"),
      { P2002: { email: ["Email is already taken"] } },
      { form: ["Unable to save user"] },
    ),
  ).toEqual({
    error: { email: ["Email is already taken"] },
    ok: false,
  });
});

test("maps an unmapped Prisma code to the fallback", () => {
  expect(
    fromError(
      knownRequestError("P2025"),
      { P2024: { form: ["Unable to load users"] } },
      { form: ["Unable to load users"] },
    ),
  ).toEqual({
    error: { form: ["Unable to load users"] },
    ok: false,
  });
});

test("maps non-Prisma errors to the fallback", () => {
  expect(
    fromError(
      new Error("connection refused"),
      { P2024: { form: ["Unable to load users"] } },
      { form: ["Unable to load users"] },
    ),
  ).toEqual({
    error: { form: ["Unable to load users"] },
    ok: false,
  });
});

test("keeps an ActionFailure in its original shape", () => {
  const failure = {
    error: { email: ["Email is already taken"] },
    ok: false as const,
    values: { email: "ada@example.com" },
  };

  expect(
    fromError<{ email: string }>(
      failure,
      { P2002: { email: ["ignored"] } },
      { form: ["Unable to save user"] },
    ),
  ).toBe(failure);
});

test("rethrows Next.js redirect errors", () => {
  const redirectError = Object.assign(new Error("NEXT_REDIRECT"), {
    digest: "NEXT_REDIRECT;replace;/sign-in;307;",
  });

  expect(() =>
    fromError(redirectError, {}, { form: ["Unable to load users"] }),
  ).toThrow(redirectError);
});

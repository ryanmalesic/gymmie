import { expect, test } from "vitest";

import { fromActionError } from "@/lib/action";
import { Prisma } from "@/lib/prisma/generated/client";

function knownRequestError(code: string) {
  return new Prisma.PrismaClientKnownRequestError("constraint failed", {
    clientVersion: "test",
    code,
  });
}

test("maps an explicitly handled Prisma code", () => {
  expect(
    fromActionError<{ email: string }>(
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
    fromActionError(
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
    fromActionError(
      new Error("connection refused"),
      { P2024: { form: ["Unable to load users"] } },
      { form: ["Unable to load users"] },
    ),
  ).toEqual({
    error: { form: ["Unable to load users"] },
    ok: false,
  });
});

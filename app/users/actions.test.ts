import { beforeEach, expect, test, vi } from "vitest";

import { createUserAction, listUsersAction } from "@/app/users/actions";
import { Prisma } from "@/lib/prisma/generated/client";
import { createUser, listUsers } from "@/lib/users/repository";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/users/repository", () => ({
  createUser: vi.fn(),
  listUsers: vi.fn(),
}));

const idleState = { error: {}, ok: false } as const;

function userForm(name: string, email: string) {
  const formData = new FormData();
  formData.set("name", name);
  formData.set("email", email);
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
});

test("listUsersAction maps a known Prisma error to a form failure", async () => {
  vi.mocked(listUsers).mockRejectedValue(
    new Prisma.PrismaClientKnownRequestError("unavailable", {
      clientVersion: "test",
      code: "P2024",
    }),
  );

  await expect(listUsersAction()).resolves.toEqual({
    error: { form: ["Unable to load users"] },
    ok: false,
  });
});

test("listUsersAction rethrows unexpected errors", async () => {
  const error = new Error("connection refused");
  vi.mocked(listUsers).mockRejectedValue(error);

  await expect(listUsersAction()).rejects.toThrow(error);
});

test("createUserAction maps a unique-constraint error to the email field", async () => {
  vi.mocked(createUser).mockRejectedValue(
    new Prisma.PrismaClientKnownRequestError("unique", {
      clientVersion: "test",
      code: "P2002",
    }),
  );

  await expect(
    createUserAction(idleState, userForm("Ada", "ada@example.com")),
  ).resolves.toEqual({
    error: { email: ["Email is already taken"] },
    ok: false,
    values: { email: "ada@example.com", name: "Ada" },
  });
});

test("createUserAction maps an unmapped Prisma error to a form failure", async () => {
  vi.mocked(createUser).mockRejectedValue(
    new Prisma.PrismaClientKnownRequestError("unavailable", {
      clientVersion: "test",
      code: "P2024",
    }),
  );

  await expect(
    createUserAction(idleState, userForm("Ada", "ada@example.com")),
  ).resolves.toEqual({
    error: { form: ["Unable to create user"] },
    ok: false,
    values: { email: "ada@example.com", name: "Ada" },
  });
});

test("createUserAction rethrows unexpected errors", async () => {
  const error = new Error("connection refused");
  vi.mocked(createUser).mockRejectedValue(error);

  await expect(
    createUserAction(idleState, userForm("Ada", "ada@example.com")),
  ).rejects.toThrow(error);
});

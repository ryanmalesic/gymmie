import { beforeEach, expect, test, vi } from "vitest";

import { addUser, fetchUsers } from "@/app/users/actions";
import { Prisma } from "@/lib/prisma/generated/client";
import { createUser, listUsers } from "@/lib/users/repository";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/users/repository", () => ({
  createUser: vi.fn(),
  listUsers: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test("fetchUsers maps a known Prisma error to a form failure", async () => {
  vi.mocked(listUsers).mockRejectedValue(
    new Prisma.PrismaClientKnownRequestError("unavailable", {
      clientVersion: "test",
      code: "P2024",
    }),
  );

  await expect(fetchUsers()).resolves.toEqual({
    error: { form: ["Unable to load users"] },
    ok: false,
  });
});

test("fetchUsers rethrows unexpected errors", async () => {
  const error = new Error("connection refused");
  vi.mocked(listUsers).mockRejectedValue(error);

  await expect(fetchUsers()).rejects.toThrow(error);
});

test("addUser maps a unique-constraint error to the email field", async () => {
  vi.mocked(createUser).mockRejectedValue(
    new Prisma.PrismaClientKnownRequestError("unique", {
      clientVersion: "test",
      code: "P2002",
    }),
  );

  await expect(
    addUser({ email: "ada@example.com", name: "Ada" }),
  ).resolves.toEqual({
    error: { email: ["Email is already taken"] },
    ok: false,
    values: { email: "ada@example.com", name: "Ada" },
  });
});

test("addUser maps an unmapped Prisma error to a form failure", async () => {
  vi.mocked(createUser).mockRejectedValue(
    new Prisma.PrismaClientKnownRequestError("unavailable", {
      clientVersion: "test",
      code: "P2024",
    }),
  );

  await expect(
    addUser({ email: "ada@example.com", name: "Ada" }),
  ).resolves.toEqual({
    error: { form: ["Unable to create user"] },
    ok: false,
    values: { email: "ada@example.com", name: "Ada" },
  });
});

test("addUser rethrows unexpected errors", async () => {
  const error = new Error("connection refused");
  vi.mocked(createUser).mockRejectedValue(error);

  await expect(
    addUser({ email: "ada@example.com", name: "Ada" }),
  ).rejects.toThrow(error);
});

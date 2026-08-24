import { beforeEach, expect, test, vi } from "vitest";

import { requireSession } from "@/lib/auth/session.server";
import { Prisma } from "@/lib/prisma/generated/client";
import { addUser, fetchUsers } from "@/lib/users/actions";
import { createUser, listUsers } from "@/lib/users/repository";

vi.mock("@/lib/auth/session.server", () => ({ requireSession: vi.fn() }));
vi.mock("@/lib/users/repository", () => ({
  createUser: vi.fn(),
  listUsers: vi.fn(),
}));

const authenticatedSession = {} as Awaited<ReturnType<typeof requireSession>>;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireSession).mockResolvedValue(authenticatedSession);
});

test("fetchUsers requires authentication before reading users", async () => {
  vi.mocked(listUsers).mockResolvedValue([]);

  await expect(fetchUsers()).resolves.toEqual({ data: [], ok: true });
  expect(requireSession).toHaveBeenCalledTimes(1);
  expect(listUsers).toHaveBeenCalledTimes(1);
});

test("fetchUsers redirects when authentication fails", async () => {
  const redirectError = new Error("redirected to sign-in");
  vi.mocked(requireSession).mockRejectedValue(redirectError);

  await expect(fetchUsers()).rejects.toBe(redirectError);
  expect(listUsers).not.toHaveBeenCalled();
});

test("fetchUsers maps an allowed Prisma error to a form failure", async () => {
  vi.mocked(listUsers).mockRejectedValue(knownRequestError("P2024"));

  await expect(fetchUsers()).resolves.toEqual({
    error: { form: ["Unable to load users"] },
    ok: false,
  });
});

test("fetchUsers maps unexpected errors to a form failure", async () => {
  vi.mocked(listUsers).mockRejectedValue(new Error("connection refused"));

  await expect(fetchUsers()).resolves.toEqual({
    error: { form: ["Unable to load users"] },
    ok: false,
  });
});

test("addUser redirects when authentication fails", async () => {
  const input = { email: "ada@example.com", name: "Ada" };
  const redirectError = new Error("redirected to sign-in");
  vi.mocked(requireSession).mockRejectedValue(redirectError);

  await expect(addUser(input)).rejects.toBe(redirectError);
  expect(createUser).not.toHaveBeenCalled();
});

test("addUser maps a unique-constraint error to the email field", async () => {
  vi.mocked(createUser).mockRejectedValue(knownRequestError("P2002"));

  await expect(
    addUser({ email: "ada@example.com", name: "Ada" }),
  ).resolves.toEqual({
    error: { email: ["Email is already taken"] },
    ok: false,
    values: { email: "ada@example.com", name: "Ada" },
  });
});

test("addUser maps an allowed availability error to the form", async () => {
  vi.mocked(createUser).mockRejectedValue(knownRequestError("P2024"));

  await expect(
    addUser({ email: "ada@example.com", name: "Ada" }),
  ).resolves.toEqual({
    error: { form: ["Unable to create user"] },
    ok: false,
    values: { email: "ada@example.com", name: "Ada" },
  });
});

test("addUser maps unmapped Prisma errors to a form failure", async () => {
  vi.mocked(createUser).mockRejectedValue(knownRequestError("P2025"));

  await expect(
    addUser({ email: "ada@example.com", name: "Ada" }),
  ).resolves.toEqual({
    error: { form: ["Unable to create user"] },
    ok: false,
    values: { email: "ada@example.com", name: "Ada" },
  });
});

test("addUser maps unexpected errors to a form failure", async () => {
  vi.mocked(createUser).mockRejectedValue(new Error("connection refused"));

  await expect(
    addUser({ email: "ada@example.com", name: "Ada" }),
  ).resolves.toEqual({
    error: { form: ["Unable to create user"] },
    ok: false,
    values: { email: "ada@example.com", name: "Ada" },
  });
});

function knownRequestError(code: string) {
  return new Prisma.PrismaClientKnownRequestError("request failed", {
    clientVersion: "test",
    code,
  });
}

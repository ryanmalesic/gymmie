import { beforeEach, expect, test, vi } from "vitest";

import { addUser, fetchUsers } from "@/lib/users/actions";

vi.mock("@/lib/auth/session.server", () => ({
  requireSession: vi.fn().mockResolvedValue({}),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test("addUser writes a user and fetchUsers reads it back", async () => {
  const created = await addUser({
    email: "  Ada@Example.com ",
    name: "  Ada Lovelace  ",
  });

  expect(created.ok).toBe(true);
  if (!created.ok) return;

  expect(created.data).toMatchObject({
    email: "ada@example.com",
    name: "Ada Lovelace",
  });
  expect(created.data.id).toMatch(/^usr_[0-9A-HJKMNP-TV-Z]{14}$/);
  await expect(fetchUsers()).resolves.toEqual({
    data: [
      expect.objectContaining({
        email: "ada@example.com",
        id: created.data.id,
        name: "Ada Lovelace",
      }),
    ],
    ok: true,
  });
});

test("addUser rejects invalid input without writing a row", async () => {
  const invalidEmail = await addUser({ email: "ada", name: "Ada" });
  expect(invalidEmail).toMatchObject({
    error: { email: ["Email is invalid"] },
    ok: false,
  });

  const blankName = await addUser({
    email: "ada@example.com",
    name: "   ",
  });
  expect(blankName).toMatchObject({
    error: { name: ["Name is required"] },
    ok: false,
  });
  await expect(fetchUsers()).resolves.toEqual({ data: [], ok: true });
});

test("addUser rejects a duplicate email without writing a second row", async () => {
  const created = await addUser({
    email: "ada@example.com",
    name: "Ada Lovelace",
  });
  expect(created.ok).toBe(true);

  const duplicate = await addUser({
    email: "ADA@example.com",
    name: "Ada Clone",
  });
  expect(duplicate).toMatchObject({
    error: { email: ["Email is already taken"] },
    ok: false,
  });
  await expect(fetchUsers()).resolves.toEqual({
    data: [expect.objectContaining({ email: "ada@example.com" })],
    ok: true,
  });
});

test("a failed create leaves later successful creates readable", async () => {
  expect((await addUser({ email: "ada", name: "Ada" })).ok).toBe(false);
  const ada = await addUser({
    email: "ada@example.com",
    name: "Ada Lovelace",
  });
  expect(ada.ok).toBe(true);
  expect(
    (await addUser({ email: "ada@example.com", name: "Ada Clone" })).ok,
  ).toBe(false);
  const al = await addUser({ email: "al@example.com", name: "Al" });
  expect(al.ok).toBe(true);
  if (!ada.ok || !al.ok) return;

  await expect(fetchUsers()).resolves.toEqual({
    data: [
      expect.objectContaining({
        email: "al@example.com",
        id: al.data.id,
        name: "Al",
      }),
      expect.objectContaining({
        email: "ada@example.com",
        id: ada.data.id,
        name: "Ada Lovelace",
      }),
    ],
    ok: true,
  });
});

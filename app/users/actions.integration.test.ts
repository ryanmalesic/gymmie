import { beforeEach, expect, test, vi } from "vitest";

import { addUser, fetchUsers } from "@/app/users/actions";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
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
  if (!created.ok) {
    return;
  }

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

test("addUser rejects an invalid email without writing a row", async () => {
  const rejected = await addUser({ email: "ada", name: "Ada" });

  expect(rejected).toMatchObject({ ok: false });
  if (rejected.ok) {
    return;
  }

  expect(rejected.error).toEqual({ email: ["Email is invalid"] });
  await expect(fetchUsers()).resolves.toEqual({ data: [], ok: true });
});

test("addUser rejects a blank name without writing a row", async () => {
  const rejected = await addUser({ email: "ada@example.com", name: "   " });

  expect(rejected).toMatchObject({ ok: false });
  if (rejected.ok) {
    return;
  }

  expect(rejected.error).toEqual({ name: ["Name is required"] });
  await expect(fetchUsers()).resolves.toEqual({ data: [], ok: true });
});

test("addUser rejects a duplicate email without writing a second row", async () => {
  const created = await addUser({
    email: "ada@example.com",
    name: "Ada Lovelace",
  });

  expect(created.ok).toBe(true);

  const rejected = await addUser({
    email: "ADA@example.com",
    name: "Ada Clone",
  });

  expect(rejected).toMatchObject({ ok: false });
  if (rejected.ok) {
    return;
  }

  expect(rejected.error).toEqual({ email: ["Email is already taken"] });
  await expect(fetchUsers()).resolves.toEqual({
    data: [expect.objectContaining({ email: "ada@example.com" })],
    ok: true,
  });
});

test("a failed create leaves later successful creates readable", async () => {
  const invalid = await addUser({ email: "ada", name: "Ada" });
  expect(invalid.ok).toBe(false);

  const ada = await addUser({
    email: "ada@example.com",
    name: "Ada Lovelace",
  });
  expect(ada.ok).toBe(true);

  const duplicate = await addUser({
    email: "ada@example.com",
    name: "Ada Clone",
  });
  expect(duplicate.ok).toBe(false);

  const al = await addUser({ email: "al@example.com", name: "Al" });
  expect(al.ok).toBe(true);
  if (!ada.ok || !al.ok) {
    return;
  }

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

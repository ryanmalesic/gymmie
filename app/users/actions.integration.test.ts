import { beforeEach, expect, test, vi } from "vitest";

import { createUserAction, listUsersAction } from "@/app/users/actions";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
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

test("createUserAction writes a user and listUsersAction reads it back", async () => {
  const created = await createUserAction(
    idleState,
    userForm("  Ada Lovelace  ", "  Ada@Example.com "),
  );

  expect(created.ok).toBe(true);
  if (!created.ok) {
    return;
  }

  expect(created.data).toMatchObject({
    email: "ada@example.com",
    name: "Ada Lovelace",
  });
  expect(created.data.id).toMatch(/^usr_[0-9A-HJKMNP-TV-Z]{14}$/);

  await expect(listUsersAction()).resolves.toEqual({
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

test("createUserAction rejects an invalid email without writing a row", async () => {
  const rejected = await createUserAction(idleState, userForm("Ada", "ada"));

  expect(rejected).toMatchObject({ ok: false });
  if (rejected.ok) {
    return;
  }

  expect(rejected.error).toEqual({ email: ["Email is invalid"] });
  await expect(listUsersAction()).resolves.toEqual({ data: [], ok: true });
});

test("createUserAction rejects a blank name without writing a row", async () => {
  const rejected = await createUserAction(
    idleState,
    userForm("   ", "ada@example.com"),
  );

  expect(rejected).toMatchObject({ ok: false });
  if (rejected.ok) {
    return;
  }

  expect(rejected.error).toEqual({ name: ["Name is required"] });
  await expect(listUsersAction()).resolves.toEqual({ data: [], ok: true });
});

test("createUserAction rejects a duplicate email without writing a second row", async () => {
  const created = await createUserAction(
    idleState,
    userForm("Ada Lovelace", "ada@example.com"),
  );

  expect(created.ok).toBe(true);

  const rejected = await createUserAction(
    idleState,
    userForm("Ada Clone", "ADA@example.com"),
  );

  expect(rejected).toMatchObject({ ok: false });
  if (rejected.ok) {
    return;
  }

  expect(rejected.error).toEqual({ email: ["Email is already taken"] });
  await expect(listUsersAction()).resolves.toEqual({
    data: [expect.objectContaining({ email: "ada@example.com" })],
    ok: true,
  });
});

test("a failed create leaves later successful creates readable", async () => {
  const invalid = await createUserAction(idleState, userForm("Ada", "ada"));
  expect(invalid.ok).toBe(false);

  const ada = await createUserAction(
    idleState,
    userForm("Ada Lovelace", "ada@example.com"),
  );
  expect(ada.ok).toBe(true);

  const duplicate = await createUserAction(
    idleState,
    userForm("Ada Clone", "ada@example.com"),
  );
  expect(duplicate.ok).toBe(false);

  const al = await createUserAction(
    idleState,
    userForm("Al", "al@example.com"),
  );
  expect(al.ok).toBe(true);
  if (!ada.ok || !al.ok) {
    return;
  }

  await expect(listUsersAction()).resolves.toEqual({
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

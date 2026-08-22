import { expect, test } from "vitest";

import { userKeys } from "@/lib/users/keys";

test("userKeys.all returns the base key array", () => {
  expect(userKeys.all).toEqual(["users"]);
});

test("userKeys.list() extends the base key with 'list'", () => {
  expect(userKeys.list()).toEqual(["users", "list"]);
});

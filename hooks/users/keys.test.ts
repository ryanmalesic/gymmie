import { expect, test } from "vitest";

import { userKeys } from "@/hooks/users/keys";

test("userKeys creates consistent query key hierarchies", () => {
  expect(userKeys.all).toEqual(["users"]);
  expect(userKeys.list()).toEqual(["users", "list"]);
  expect(userKeys.details()).toEqual(["users", "detail"]);
  expect(userKeys.detail("123")).toEqual(["users", "detail", "123"]);
});

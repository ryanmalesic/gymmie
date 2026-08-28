import { expect, test } from "vitest";

import {
  createUserAction,
  deleteUserAction,
  listUsersAction,
  readUserAction,
  updateUserAction,
} from "@/app/actions/users";

test("exports all user domain server action functions", () => {
  expect(createUserAction).toBeTypeOf("function");
  expect(readUserAction).toBeTypeOf("function");
  expect(updateUserAction).toBeTypeOf("function");
  expect(deleteUserAction).toBeTypeOf("function");
  expect(listUsersAction).toBeTypeOf("function");
});

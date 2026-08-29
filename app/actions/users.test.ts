import { expect, test } from "vitest";

import {
  createStripeAccountLinkAction,
  createUserAction,
  deleteUserAction,
  getMyStripeAccountStateAction,
  getMyUserAction,
  listUsersAction,
  onboardMeAction,
  readUserAction,
  updateUserAction,
} from "@/app/actions/users";

test("exports all user domain server action functions", () => {
  expect(createUserAction).toBeTypeOf("function");
  expect(readUserAction).toBeTypeOf("function");
  expect(updateUserAction).toBeTypeOf("function");
  expect(deleteUserAction).toBeTypeOf("function");
  expect(listUsersAction).toBeTypeOf("function");
  expect(createStripeAccountLinkAction).toBeTypeOf("function");
  expect(getMyStripeAccountStateAction).toBeTypeOf("function");
  expect(getMyUserAction).toBeTypeOf("function");
  expect(onboardMeAction).toBeTypeOf("function");
});

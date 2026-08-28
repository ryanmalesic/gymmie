import { expect, test } from "vitest";

import * as userHooks from "@/hooks/users";

test("hooks/users exports keys, mutations, and queries", () => {
  expect(userHooks.userKeys).toBeDefined();
  expect(userHooks.useCreateUserMutation).toBeDefined();
  expect(userHooks.useUsersQuery).toBeDefined();
});

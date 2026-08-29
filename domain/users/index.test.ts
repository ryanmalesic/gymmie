import { expect, test } from "vitest";

import { userCommands } from "@/domain/users";

test("exports all user domain commands in registry", () => {
  expect(userCommands.createUser).toBeDefined();
  expect(userCommands.readUser).toBeDefined();
  expect(userCommands.updateUser).toBeDefined();
  expect(userCommands.deleteUser).toBeDefined();
  expect(userCommands.listUsers).toBeDefined();
  expect(userCommands.getMyUser).toBeDefined();
  expect(userCommands.onboardMe).toBeDefined();
});

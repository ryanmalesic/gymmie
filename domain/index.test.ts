import { expect, test } from "vitest";

import { type AllCommandName, getAllCommands, getCommand } from "@/domain";

test("dynamically aggregates all domain commands", async () => {
  const commands = await getAllCommands();
  expect(Object.keys(commands).length).toBe(5);
  expect(commands.createUser).toBeDefined();
  expect(commands.readUser).toBeDefined();
  expect(commands.updateUser).toBeDefined();
  expect(commands.deleteUser).toBeDefined();
  expect(commands.listUsers).toBeDefined();
});

test("gets command by name and version with version locking", async () => {
  const commandName: AllCommandName = "createUser";
  const createUser = await getCommand(commandName, "2026-08-27");
  expect(createUser).toBeDefined();
  expect(createUser?.spec.name).toBe("createUser");
  expect(createUser?.spec.version).toBe("2026-08-27");

  const missing = await getCommand("nonExistent", "2026-08-27");
  expect(missing).toBeUndefined();

  const wrongVersion = await getCommand("createUser", "1999-01-01");
  expect(wrongVersion).toBeUndefined();
});

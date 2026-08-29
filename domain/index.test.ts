import { expect, test } from "vitest";

import { getAllCommands, getCommand } from "@/domain";

test("aggregates all domain commands from the registries", async () => {
  const commands = await getAllCommands();
  expect(Object.keys(commands).length).toBe(14);
  expect(commands.CreateStripeAccountLink).toBeDefined();
  expect(commands.CreateUser).toBeDefined();
  expect(commands.ReadUser).toBeDefined();
  expect(commands.UpdateUser).toBeDefined();
  expect(commands.DeleteUser).toBeDefined();
  expect(commands.ListUsers).toBeDefined();
  expect(commands.GetMyStripeAccountState).toBeDefined();
  expect(commands.GetMyUser).toBeDefined();
  expect(commands.OnboardMe).toBeDefined();
  expect(commands.CreateLocation).toBeDefined();
  expect(commands.ReadLocation).toBeDefined();
  expect(commands.UpdateLocation).toBeDefined();
  expect(commands.DeleteLocation).toBeDefined();
  expect(commands.ListMyLocations).toBeDefined();
});

test("gets command by name and version with version locking", async () => {
  const createUser = await getCommand("CreateUser", "2026-08-27");
  expect(createUser).toBeDefined();
  expect(createUser?.spec.name).toBe("CreateUser");
  expect(createUser?.spec.version).toBe("2026-08-27");

  const missing = await getCommand("nonExistent", "2026-08-27");
  expect(missing).toBeUndefined();

  const wrongVersion = await getCommand("CreateUser", "1999-01-01");
  expect(wrongVersion).toBeUndefined();
});

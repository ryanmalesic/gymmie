import { expect, test } from "vitest";

import { locationCommands } from "@/domain/locations";

test("exports all location domain commands in registry", () => {
  expect(locationCommands.createLocation).toBeDefined();
  expect(locationCommands.readLocation).toBeDefined();
  expect(locationCommands.updateLocation).toBeDefined();
  expect(locationCommands.deleteLocation).toBeDefined();
  expect(locationCommands.listMyLocations).toBeDefined();
});

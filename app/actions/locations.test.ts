import { expect, test } from "vitest";

import {
  createLocationAction,
  deleteLocationAction,
  listMyLocationsAction,
  readLocationAction,
  updateLocationAction,
} from "@/app/actions/locations";

test("exports all location domain server action functions", () => {
  expect(createLocationAction).toBeTypeOf("function");
  expect(readLocationAction).toBeTypeOf("function");
  expect(updateLocationAction).toBeTypeOf("function");
  expect(deleteLocationAction).toBeTypeOf("function");
  expect(listMyLocationsAction).toBeTypeOf("function");
});

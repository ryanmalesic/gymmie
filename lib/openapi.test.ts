import { expect, test } from "vitest";

import { registry } from "@/lib/openapi";

test("exports the OpenAPI singleton registry", () => {
  expect(registry).toBeDefined();
  expect(registry.definitions).toBeDefined();
});

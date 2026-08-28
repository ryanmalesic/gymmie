import { expect, test } from "vitest";

import { API_VERSION } from "@/lib/commands/version";

test("API_VERSION is a calendar date lock for every RPC command", () => {
  expect(API_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
});

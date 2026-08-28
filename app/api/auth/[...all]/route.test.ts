import { expect, test } from "vitest";

import { GET, POST } from "@/app/api/auth/[...all]/route";

test("exports GET and POST HTTP handlers for BetterAuth", () => {
  expect(GET).toBeTypeOf("function");
  expect(POST).toBeTypeOf("function");
});

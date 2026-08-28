import { expect, test } from "vitest";

import { authClient } from "@/lib/auth/client";

test("creates and exports the BetterAuth client", () => {
  expect(authClient).toBeDefined();
  expect(authClient.signIn).toBeDefined();
  expect(authClient.signOut).toBeDefined();
});

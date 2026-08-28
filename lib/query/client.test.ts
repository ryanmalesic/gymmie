import { expect, test } from "vitest";

import { makeQueryClient } from "@/lib/query/client";

test("makeQueryClient creates QueryClient with default stale time", () => {
  const client = makeQueryClient();
  expect(client).toBeDefined();
  expect(client.getDefaultOptions().queries?.staleTime).toBe(60_000);
});

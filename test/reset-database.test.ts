import { expect, test } from "vitest";

import { resetDatabase } from "@/test/reset-database";

test("refuses to run when CI is unset", async () => {
  const previous = process.env.CI;
  delete process.env.CI;

  try {
    await expect(resetDatabase()).rejects.toThrow(/CI is set/);
  } finally {
    if (previous === undefined) {
      delete process.env.CI;
    } else {
      process.env.CI = previous;
    }
  }
});

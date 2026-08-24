import { expect, test } from "vitest";

import { resetDatabase } from "@/test/reset-database";

test("refuses to run without the test-database marker", async () => {
  const previous = process.env.GYMMIE_TEST_DATABASE;
  delete process.env.GYMMIE_TEST_DATABASE;

  try {
    await expect(resetDatabase()).rejects.toThrow(/GYMMIE_TEST_DATABASE=true/);
  } finally {
    if (previous === undefined) {
      delete process.env.GYMMIE_TEST_DATABASE;
    } else {
      process.env.GYMMIE_TEST_DATABASE = previous;
    }
  }
});

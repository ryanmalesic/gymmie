import { expect, test } from "vitest";

import { databaseUrl } from "@/lib/db";

test("databaseUrl throws when DATABASE_URL is unset", () => {
  const previous = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;

  try {
    expect(() => databaseUrl()).toThrow(/DATABASE_URL is not set/);
  } finally {
    if (previous === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = previous;
    }
  }
});

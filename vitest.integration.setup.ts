import { beforeEach } from "vitest";

import { resetDatabase } from "@/test/reset-database";

process.env.CI ??= "true";

beforeEach(async () => {
  await resetDatabase();
});

import { beforeEach } from "vitest";

import { resetDatabase } from "@/test/reset-database";

beforeEach(async () => {
  await resetDatabase();
});

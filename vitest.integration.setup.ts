import { beforeEach, vi } from "vitest";

import { resetDatabase } from "@/test/reset-database";

vi.mock("server-only", () => ({}));

beforeEach(async () => {
  await resetDatabase();
});

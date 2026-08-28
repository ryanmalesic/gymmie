import { afterEach, beforeEach, vi } from "vitest";

import { getPrisma } from "@/lib/db";
import { resetDatabase } from "@/test/reset-database";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

beforeEach(async () => {
  await resetDatabase();
});

afterEach(async () => {
  await getPrisma().$disconnect();
});

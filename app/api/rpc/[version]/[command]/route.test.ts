import { type NextRequest } from "next/server";
import { expect, test } from "vitest";

process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgres://postgres:postgres@localhost:5432/test";

import { POST } from "@/app/api/rpc/[version]/[command]/route";

test("returns 404 for unknown RPC commands", async () => {
  const req = new Request(
    "http://localhost:3000/api/rpc/2026-08-27/nonExistent",
    {
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
  ) as NextRequest;

  const res = await POST(req, {
    params: Promise.resolve({
      command: "nonExistent",
      version: "2026-08-27",
    }),
  });

  expect(res.status).toBe(404);
  const data = await res.json();
  expect(data.code).toBe("NOT_FOUND");
});

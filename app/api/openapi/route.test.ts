import { expect, test, vi } from "vitest";

import { GET } from "@/app/api/openapi/route";
import { requireSession } from "@/lib/auth/session.server";

vi.mock("@/lib/auth/session.server", () => ({
  requireSession: vi.fn(),
}));

test("GET /api/openapi requires a session and serves lib/openapi.yaml", async () => {
  vi.mocked(requireSession).mockResolvedValue({
    session: { expiresAt: new Date(), id: "s1" },
    user: { email: "u@example.com", id: "u1" },
  } as never);

  const res = await GET();

  expect(requireSession).toHaveBeenCalledWith("/docs");
  expect(res.status).toBe(200);
  expect(res.headers.get("content-type")).toContain("application/yaml");

  const body = await res.text();
  expect(body).toContain("openapi: 3.1.0");
  expect(body).toContain("title: App RPC Command API");
  expect(body).toContain("/api/rpc/2026-08-27/CreateUser");
});

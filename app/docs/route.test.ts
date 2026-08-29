import { expect, test, vi } from "vitest";

import { GET } from "@/app/docs/route";
import { requireSession } from "@/lib/auth/session.server";

vi.mock("@/lib/auth/session.server", () => ({
  requireSession: vi.fn(),
}));

test("GET /docs requires a session and serves Swagger UI", async () => {
  vi.mocked(requireSession).mockResolvedValue({
    session: { expiresAt: new Date(), id: "s1" },
    user: { email: "u@example.com", id: "u1" },
  } as never);

  const res = await GET();

  expect(requireSession).toHaveBeenCalledWith("/docs");
  expect(res.status).toBe(200);
  expect(res.headers.get("content-type")).toContain("text/html");

  const body = await res.text();
  expect(body).toContain("SwaggerUIBundle");
  expect(body).toContain('url: "/api/openapi"');
  expect(body).toContain("swagger-ui-bundle.js");
  expect(body).toContain("swagger-ui.css");
});

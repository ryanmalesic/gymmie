import { expect, test, vi } from "vitest";

import { GET } from "@/app/docs/[asset]/route";
import { requireSession } from "@/lib/auth/session.server";

vi.mock("@/lib/auth/session.server", () => ({
  requireSession: vi.fn(),
}));

test("GET /docs/[asset] requires a session and serves swagger-ui-dist files", async () => {
  vi.mocked(requireSession).mockResolvedValue({
    session: { expiresAt: new Date(), id: "s1" },
    user: { email: "u@example.com", id: "u1" },
  } as never);

  const res = await GET(
    new Request("http://localhost:3000/docs/swagger-ui.css"),
    {
      params: Promise.resolve({ asset: "swagger-ui.css" }),
    },
  );

  expect(requireSession).toHaveBeenCalledWith("/docs");
  expect(res.status).toBe(200);
  expect(res.headers.get("content-type")).toContain("text/css");
  expect(await res.text()).toContain(".swagger-ui");
});

test("GET /docs/[asset] returns 404 for unknown files", async () => {
  vi.mocked(requireSession).mockResolvedValue({
    session: { expiresAt: new Date(), id: "s1" },
    user: { email: "u@example.com", id: "u1" },
  } as never);

  const res = await GET(new Request("http://localhost:3000/docs/secret"), {
    params: Promise.resolve({ asset: "../package.json" }),
  });

  expect(res.status).toBe(404);
});

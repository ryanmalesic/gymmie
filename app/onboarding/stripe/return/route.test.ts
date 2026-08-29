import { beforeEach, describe, expect, test, vi } from "vitest";

const { mockRedirect, mockRequireSession } = vi.hoisted(() => ({
  mockRedirect: vi.fn(() => {
    throw new Error("redirect");
  }),
  mockRequireSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mockRedirect }));
vi.mock("@/lib/auth/session.server", () => ({
  requireSession: mockRequireSession,
}));

import { GET } from "@/app/onboarding/stripe/return/route";

describe("GET /onboarding/stripe/return", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireSession.mockResolvedValue({
      session: { expiresAt: new Date(), id: "s1" },
      user: { email: "u@example.com", id: "u1" },
    });
  });

  test("authenticates and redirects to the dashboard", async () => {
    await expect(GET()).rejects.toThrow("redirect");

    expect(mockRequireSession).toHaveBeenCalledWith("/dashboard");
    expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
  });
});

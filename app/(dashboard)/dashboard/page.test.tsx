import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import DashboardRoute from "@/app/(dashboard)/dashboard/page";
import { requireSession } from "@/lib/auth/session.server";

vi.mock("@/lib/auth/session.server", () => ({
  requireSession: vi.fn(),
}));

test("renders real dashboard home page with welcome heading and users card", async () => {
  vi.mocked(requireSession).mockResolvedValue({
    session: { expiresAt: new Date(), id: "s1" },
    user: { email: "u@example.com", id: "u1", name: "Alice" },
  } as never);

  const Page = await DashboardRoute();
  render(Page);

  expect(
    screen.getByRole("heading", { name: "Welcome back, Alice" }),
  ).toBeInTheDocument();
  expect(
    screen.getByText("Add people and keep your gym roster current."),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "View users" })).toHaveAttribute(
    "href",
    "/users",
  );
});

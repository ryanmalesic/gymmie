import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import MarketingRouteLayout from "@/app/(marketing)/layout";
import { getSession } from "@/lib/auth/session.server";

vi.mock("@/lib/auth/session.server", () => ({
  getSession: vi.fn(),
}));

test("renders real marketing layout header and footer with unauthenticated state", async () => {
  vi.mocked(getSession).mockResolvedValue(null);

  const Layout = await MarketingRouteLayout({
    children: <p>Marketing Body Content</p>,
  });
  render(Layout);

  expect(screen.getByRole("link", { name: "Sign in" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Get started" })).toBeInTheDocument();
  expect(screen.getByText("Marketing Body Content")).toBeInTheDocument();
  expect(screen.getAllByText("Gymmie").length).toBeGreaterThan(0);
});

test("renders real marketing layout header with authenticated state", async () => {
  vi.mocked(getSession).mockResolvedValue({
    session: { expiresAt: new Date(), id: "s1" },
    user: { email: "u@example.com", id: "u1", name: "Alice" },
  } as never);

  const Layout = await MarketingRouteLayout({
    children: <p>Signed In Content</p>,
  });
  render(Layout);

  expect(
    screen.getByRole("link", { name: "Open dashboard" }),
  ).toBeInTheDocument();
  expect(screen.getByText("Signed In Content")).toBeInTheDocument();
});

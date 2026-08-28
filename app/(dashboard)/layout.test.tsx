import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import DashboardLayout from "@/app/(dashboard)/layout";
import { requireSession } from "@/lib/auth/session.server";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/lib/auth/session.server", () => ({
  requireSession: vi.fn(),
}));

test("renders real dashboard layout shell with navigation, user, and content", async () => {
  vi.mocked(requireSession).mockResolvedValue({
    session: { expiresAt: new Date(), id: "s1" },
    user: { email: "u@example.com", id: "u1", name: "Alice" },
  } as never);

  const Layout = await DashboardLayout({
    children: <div data-testid="dashboard-content">Dashboard Content</div>,
  });
  render(Layout);

  expect(screen.getByText("Gymmie")).toBeInTheDocument();
  expect(screen.getAllByText("Dashboard").length).toBeGreaterThan(0);
  expect(screen.getByText("Users")).toBeInTheDocument();
  expect(screen.getByText("Alice")).toBeInTheDocument();
  expect(screen.getByTestId("dashboard-content")).toBeInTheDocument();
});

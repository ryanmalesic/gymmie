import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { expect, test, vi } from "vitest";

import { DashboardHeader } from "@/components/dashboard/shell/header";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

vi.mock("@/components/dashboard/shell/header/command-menu", () => ({
  CommandMenu: () => <div data-testid="command-menu">Command Menu</div>,
}));

vi.mock("@/components/ui/sidebar", () => ({
  SidebarTrigger: () => <button data-testid="sidebar-trigger">Toggle</button>,
}));

test("renders dashboard header with breadcrumbs and command menu", () => {
  vi.mocked(usePathname).mockReturnValue("/users");

  render(<DashboardHeader />);

  expect(screen.getByTestId("sidebar-trigger")).toBeInTheDocument();
  expect(screen.getByTestId("command-menu")).toBeInTheDocument();
  expect(screen.getByText("Users")).toBeInTheDocument();
  expect(screen.getByText("Dashboard")).toBeInTheDocument();
});

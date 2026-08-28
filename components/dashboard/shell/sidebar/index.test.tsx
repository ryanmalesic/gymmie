import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { DashboardSidebar } from "@/components/dashboard/shell/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

test("renders dashboard sidebar with navigation links and user profile", () => {
  render(
    <SidebarProvider>
      <DashboardSidebar
        user={{ email: "test@example.com", name: "Test User" }}
      />
    </SidebarProvider>,
  );

  expect(screen.getByText("Gymmie")).toBeInTheDocument();
  expect(screen.getByText("Dashboard")).toBeInTheDocument();
  expect(screen.getByText("Users")).toBeInTheDocument();
  expect(screen.getByText("Test User")).toBeInTheDocument();
});

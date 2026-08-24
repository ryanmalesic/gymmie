import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { DashboardShell } from "@/components/dashboard/shell";

const mocks = vi.hoisted(() => ({
  pathname: "/dashboard",
  push: vi.fn(),
  refresh: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
  useRouter: () => ({
    push: mocks.push,
    refresh: mocks.refresh,
  }),
}));

vi.mock("@/lib/auth/client", () => ({
  authClient: {
    signOut: mocks.signOut,
  },
}));

afterEach(() => {
  cleanup();
  mocks.pathname = "/dashboard";
  mocks.push.mockReset();
  mocks.refresh.mockReset();
  mocks.signOut.mockReset();
});

test("renders the inset shell with the session user", () => {
  render(
    <DashboardShell user={{ email: "ada@example.com", name: "Ada Lovelace" }}>
      <p>Dashboard body</p>
    </DashboardShell>,
  );

  expect(screen.getByText("Gymmie")).toBeVisible();
  expect(screen.getAllByText("Ada Lovelace").length).toBeGreaterThan(0);
  expect(screen.getAllByText("ada@example.com").length).toBeGreaterThan(0);
  expect(screen.getByText("Dashboard body")).toBeVisible();
  expect(screen.getByRole("link", { name: /gymmie/i })).toHaveAttribute(
    "href",
    "/dashboard",
  );
  expect(screen.getByRole("link", { name: "Users" })).toHaveAttribute(
    "href",
    "/users",
  );
});

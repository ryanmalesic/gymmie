import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { CommandMenu } from "@/components/dashboard/shell/header/command-menu";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
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
  mocks.push.mockReset();
  mocks.refresh.mockReset();
  mocks.signOut.mockReset();
});

test("lists dashboard, users, and log out commands", async () => {
  render(<CommandMenu />);

  fireEvent.click(screen.getByRole("button", { name: /search/i }));

  expect(
    await screen.findByRole("option", { name: /dashboard/i }),
  ).toBeVisible();
  expect(screen.getByRole("option", { name: /users/i })).toBeVisible();
  expect(screen.getByRole("option", { name: /log out/i })).toBeVisible();
});

test("navigates to users from the command menu", async () => {
  render(<CommandMenu />);
  fireEvent.click(screen.getByRole("button", { name: /search/i }));
  fireEvent.click(await screen.findByRole("option", { name: /users/i }));

  expect(mocks.push).toHaveBeenCalledWith("/users");
});

test("signs out from the command menu", async () => {
  mocks.signOut.mockResolvedValue({ data: null, error: null });
  render(<CommandMenu />);
  fireEvent.click(screen.getByRole("button", { name: /search/i }));
  fireEvent.click(await screen.findByRole("option", { name: /log out/i }));

  expect(mocks.signOut).toHaveBeenCalledOnce();
});

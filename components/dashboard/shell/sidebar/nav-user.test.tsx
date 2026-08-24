import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { NavUser } from "@/components/dashboard/shell/sidebar/nav-user";
import { SidebarProvider } from "@/components/ui/sidebar";

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

test("signs out from the user menu", async () => {
  mocks.signOut.mockImplementation((options) => {
    options?.fetchOptions?.onSuccess?.();
    return Promise.resolve({ data: null, error: null });
  });

  render(
    <SidebarProvider>
      <NavUser user={{ email: "ada@example.com", name: "Ada Lovelace" }} />
    </SidebarProvider>,
  );

  fireEvent.click(screen.getByRole("button", { name: /ada lovelace/i }));
  fireEvent.click(await screen.findByRole("menuitem", { name: "Log out" }));

  expect(mocks.signOut).toHaveBeenCalledOnce();
  expect(mocks.push).toHaveBeenCalledWith("/");
  expect(mocks.refresh).toHaveBeenCalledOnce();
});

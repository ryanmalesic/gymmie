import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { type ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";

import { UsersPage } from "@/components/users/page";

const mocks = vi.hoisted(() => ({
  addUser: vi.fn(),
  fetchUsers: vi.fn(),
}));

vi.mock("@/lib/users/actions", () => mocks);

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

test("keeps the list loading while refetching an initial failure", () => {
  mocks.fetchUsers.mockImplementation(() => new Promise(() => {}));

  render(
    <UsersPage
      initialState={{
        error: { form: ["Unable to load users"] },
        ok: false,
      }}
    />,
    { wrapper },
  );

  expect(screen.getByRole("status")).toHaveAttribute(
    "aria-label",
    "Loading people",
  );
  expect(screen.queryByText("No users yet.")).not.toBeInTheDocument();
  expect(mocks.fetchUsers).toHaveBeenCalledOnce();
});

test("renders the user-list failure state", async () => {
  mocks.fetchUsers.mockResolvedValue({
    error: { form: ["Unable to load users"] },
    ok: false,
  });

  render(<UsersPage />, { wrapper });

  const title = await screen.findByText("Unable to load people");
  expect(title.closest('[role="alert"]')).toHaveTextContent(
    "Unable to load users",
  );
  expect(screen.queryByText("No users yet.")).not.toBeInTheDocument();
});

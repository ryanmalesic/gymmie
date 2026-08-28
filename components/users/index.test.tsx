import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { type ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";

import { UsersPage } from "@/components/users";

const mocks = vi.hoisted(() => ({
  createUserAction: vi.fn(),
  listUsersAction: vi.fn(),
}));

vi.mock("@/app/actions/users", () => mocks);

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
  mocks.listUsersAction.mockImplementation(() => new Promise(() => {}));

  render(
    <UsersPage
      initialState={{
        code: "INTERNAL_ERROR",
        error: "Unable to load users",
        success: false,
      }}
    />,
    { wrapper },
  );

  expect(screen.getByRole("status")).toHaveAttribute(
    "aria-label",
    "Loading people",
  );
  expect(screen.queryByText("No users yet.")).not.toBeInTheDocument();
  expect(mocks.listUsersAction).toHaveBeenCalledOnce();
});

test("renders the user-list failure state", async () => {
  mocks.listUsersAction.mockResolvedValue({
    code: "INTERNAL_ERROR",
    error: "Unable to load users",
    success: false,
  });

  render(<UsersPage />, { wrapper });

  const title = await screen.findByText("Unable to load people");
  expect(title.closest('[role="alert"]')).toHaveTextContent(
    "Unable to load users",
  );
  expect(screen.queryByText("No users yet.")).not.toBeInTheDocument();
});

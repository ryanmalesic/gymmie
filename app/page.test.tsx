import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import Home from "@/app/page";
import { fetchUsers } from "@/app/users/actions";

vi.mock("@/app/users/actions", () => ({
  addUser: vi.fn(),
  fetchUsers: vi.fn(),
}));

afterEach(cleanup);

function Wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

test("renders the users heading and existing users", async () => {
  vi.mocked(fetchUsers).mockResolvedValue({
    data: [{ email: "ada@example.com", id: "usr_1", name: "Ada" }],
    ok: true,
  });

  render(await Home(), { wrapper: Wrapper });

  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Users");
  expect(screen.getByLabelText("Name")).toBeInTheDocument();
  expect(screen.getByLabelText("Email")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Add user" })).toBeInTheDocument();
  expect(screen.getByRole("cell", { name: "Ada" })).toBeInTheDocument();
  expect(
    screen.getByRole("cell", { name: "ada@example.com" }),
  ).toBeInTheDocument();
});

test("renders a load error when listing users fails", async () => {
  vi.mocked(fetchUsers).mockResolvedValue({
    error: { form: ["Unable to load users"] },
    ok: false,
  });

  render(await Home(), { wrapper: Wrapper });

  await waitFor(() => {
    expect(screen.getByRole("alert")).toHaveTextContent("Unable to load users");
  });
});

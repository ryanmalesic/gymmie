import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { type ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";

import { UserForm } from "@/components/users/form";
import { type ActionResult } from "@/lib/action";
import { type ListedUser } from "@/lib/users/queries";
import { type UserInput } from "@/lib/users/schema";

type MockAction = (
  input: UserInput,
) => Promise<ActionResult<ListedUser, UserInput>>;

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

test("renders name and email fields", () => {
  const action: MockAction = async () => ({
    data: { email: "", id: "", name: "" },
    ok: true,
  });

  render(<UserForm action={action} />, { wrapper });

  expect(screen.getByLabelText("Name")).toBeInTheDocument();
  expect(screen.getByLabelText("Email")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /add user/i })).toBeInTheDocument();
});

test("shows server-returned errors after submit", async () => {
  const action: MockAction = async () => ({
    error: { email: ["Email is already taken"] },
    ok: false,
    values: { email: "ada@example.com", name: "Ada" },
  });

  render(<UserForm action={action} />, { wrapper });

  fireEvent.change(screen.getByLabelText("Name"), {
    target: { value: "Ada" },
  });
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "ada@example.com" },
  });

  const form = screen
    .getByRole("button", { name: /add user/i })
    .closest("form");
  fireEvent.submit(form!);

  await waitFor(() => {
    expect(screen.getByText("Email is already taken")).toBeInTheDocument();
  });
});

test("resets form after successful submission", async () => {
  const action: MockAction = async () => ({
    data: { email: "ada@example.com", id: "usr_1", name: "Ada" },
    ok: true,
  });

  render(<UserForm action={action} />, { wrapper });

  fireEvent.change(screen.getByLabelText("Name"), {
    target: { value: "Ada" },
  });
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "ada@example.com" },
  });

  const form = screen
    .getByRole("button", { name: /add user/i })
    .closest("form");
  fireEvent.submit(form!);

  await waitFor(() => {
    expect(screen.getByLabelText("Name")).toHaveValue("");
    expect(screen.getByLabelText("Email")).toHaveValue("");
  });
});

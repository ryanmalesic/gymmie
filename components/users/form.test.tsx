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

const mocks = vi.hoisted(() => ({ addUser: vi.fn() }));

vi.mock("@/lib/users/actions", () => ({
  addUser: mocks.addUser,
}));

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
  mocks.addUser.mockReset();
});

test("renders name and email fields", () => {
  render(<UserForm />, { wrapper });

  expect(screen.getByLabelText("Name")).toBeInTheDocument();
  expect(screen.getByLabelText("Email")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /add user/i })).toBeInTheDocument();
});

test("shows server-returned errors after submit", async () => {
  mocks.addUser.mockResolvedValue({
    error: { email: ["Email is already taken"] },
    ok: false,
    values: { email: "ada@example.com", name: "Ada" },
  });

  render(<UserForm />, { wrapper });
  submitUser("Ada", "ada@example.com");

  await waitFor(() => {
    expect(screen.getByText("Email is already taken")).toBeInTheDocument();
  });
});

test("resets form after successful submission", async () => {
  mocks.addUser.mockResolvedValue({
    data: { email: "ada@example.com", id: "usr_1", name: "Ada" },
    ok: true,
  });

  render(<UserForm />, { wrapper });
  submitUser("Ada", "ada@example.com");

  await waitFor(() => {
    expect(screen.getByLabelText("Name")).toHaveValue("");
    expect(screen.getByLabelText("Email")).toHaveValue("");
  });
});

function submitUser(name: string, email: string) {
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: name } });
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: email },
  });
  fireEvent.submit(
    screen.getByRole("button", { name: /add user/i }).closest("form")!,
  );
}

test("shows a server form error after submission", async () => {
  mocks.addUser.mockResolvedValue({
    error: { form: ["Unable to create user"] },
    ok: false,
  });

  render(<UserForm />, { wrapper });
  submitUser("Ada", "ada@example.com");

  expect(await screen.findByText("Unable to create user")).toBeInTheDocument();
});

test("shows a safe message when submission rejects unexpectedly", async () => {
  mocks.addUser.mockRejectedValue(new Error("database unavailable"));

  render(<UserForm />, { wrapper });
  submitUser("Ada", "ada@example.com");

  expect(
    await screen.findByText("Unable to create user. Please try again."),
  ).toBeInTheDocument();
});

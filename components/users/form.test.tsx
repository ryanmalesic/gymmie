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

import { UserForm, UserFormFallback } from "@/components/users/form";

const mocks = vi.hoisted(() => ({ createUserAction: vi.fn() }));

vi.mock("@/app/actions/users", () => ({
  createUserAction: mocks.createUserAction,
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
  mocks.createUserAction.mockReset();
});

test("renders name and email fields", () => {
  render(<UserForm />, { wrapper });

  expect(screen.getByLabelText("Name")).toBeInTheDocument();
  expect(screen.getByLabelText("Email")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /add user/i })).toBeInTheDocument();
});

test("renders a static add-user form while the page is loading", () => {
  render(<UserFormFallback />);

  expect(screen.getByLabelText("Name")).toBeInTheDocument();
  expect(screen.getByLabelText("Email")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /add user/i })).toBeInTheDocument();
});

test("shows server-returned errors after submit", async () => {
  mocks.createUserAction.mockResolvedValue({
    code: "CONFLICT",
    error: "User already exists",
    fieldErrors: { email: ["Email is already taken"] },
    success: false,
  });

  render(<UserForm />, { wrapper });
  submitUser("Ada", "ada@example.com");

  await waitFor(() => {
    expect(screen.getByText("Email is already taken")).toBeInTheDocument();
  });
});

test("resets form after successful submission", async () => {
  mocks.createUserAction.mockResolvedValue({
    data: {
      createdAt: new Date(),
      email: "ada@example.com",
      emailVerified: false,
      id: "usr_1",
      image: null,
      name: "Ada",
      updatedAt: new Date(),
    },
    success: true,
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
  mocks.createUserAction.mockResolvedValue({
    code: "INTERNAL_ERROR",
    error: "Unable to create user",
    success: false,
  });

  render(<UserForm />, { wrapper });
  submitUser("Ada", "ada@example.com");

  expect(await screen.findByText("Unable to create user")).toBeInTheDocument();
});

test("shows a safe message when submission rejects unexpectedly", async () => {
  mocks.createUserAction.mockRejectedValue(new Error("database unavailable"));

  render(<UserForm />, { wrapper });
  submitUser("Ada", "ada@example.com");

  expect(await screen.findByText("Unable to create user")).toBeInTheDocument();
});

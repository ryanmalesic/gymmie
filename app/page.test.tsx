import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import Home from "@/app/page";
import { listUsersAction } from "@/app/users/actions";

vi.mock("@/app/users/actions", () => ({
  createUserAction: vi.fn(),
  listUsersAction: vi.fn(),
}));

afterEach(cleanup);

test("renders the users heading and existing users", async () => {
  vi.mocked(listUsersAction).mockResolvedValue({
    data: [{ email: "ada@example.com", id: "usr_1", name: "Ada" }],
    ok: true,
  });

  render(await Home());

  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Users");
  expect(screen.getByLabelText("Name")).toBeInTheDocument();
  expect(screen.getByLabelText("Email")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Add user" })).toBeInTheDocument();
  expect(screen.getByText("Ada (ada@example.com)")).toBeInTheDocument();
});

test("renders a load error when listing users fails", async () => {
  vi.mocked(listUsersAction).mockResolvedValue({
    error: { form: ["Unable to load users"] },
    ok: false,
  });

  render(await Home());

  expect(screen.getByRole("alert")).toHaveTextContent("Unable to load users");
});

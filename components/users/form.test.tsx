import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { UserForm } from "@/components/users/form";

afterEach(cleanup);

test("shows an action error on the email field", async () => {
  render(
    <UserForm
      action={async () => ({
        error: { email: ["Email is invalid"] },
        ok: false,
        values: { email: "ada", name: "Ada" },
      })}
    />,
  );

  fireEvent.change(screen.getByLabelText("Name"), {
    target: { value: "Ada" },
  });
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "ada" },
  });
  const form = screen.getByRole("button", { name: "Add user" }).closest("form");
  expect(form).not.toBeNull();
  fireEvent.submit(form!);

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Email is invalid",
  );
  expect(screen.getByLabelText("Email")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  expect(screen.getByLabelText("Name")).toHaveValue("Ada");
  expect(screen.getByLabelText("Email")).toHaveValue("ada");
});

test("clears the form after a successful create", async () => {
  render(
    <UserForm
      action={async () => ({
        data: { email: "ada@example.com", id: "usr_1", name: "Ada" },
        ok: true,
      })}
    />,
  );

  fireEvent.change(screen.getByLabelText("Name"), {
    target: { value: "Ada" },
  });
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "ada@example.com" },
  });
  const form = screen.getByRole("button", { name: "Add user" }).closest("form");
  expect(form).not.toBeNull();
  fireEvent.submit(form!);

  await waitFor(() => {
    expect(screen.getByLabelText("Name")).toHaveValue("");
    expect(screen.getByLabelText("Email")).toHaveValue("");
  });
});

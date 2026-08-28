import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import UsersLoading from "@/app/(dashboard)/users/loading";

test("renders the users loading fallback UI with skeletons", () => {
  render(<UsersLoading />);

  expect(screen.getByRole("heading", { name: "Users" })).toBeVisible();
  expect(screen.getByLabelText("Name")).toBeVisible();
  expect(screen.getByLabelText("Email")).toBeVisible();
  expect(screen.getByRole("button", { name: "Add user" })).toBeVisible();
  expect(screen.getByPlaceholderText("Filter emails...")).toBeVisible();
  expect(screen.getByRole("columnheader", { name: /name/i })).toBeVisible();
  expect(screen.getByRole("columnheader", { name: /email/i })).toBeVisible();
  expect(screen.getByRole("status", { name: "Loading people" })).toBeVisible();
});

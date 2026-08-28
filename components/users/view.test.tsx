import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { UsersView } from "@/components/users/view";

test("renders users view with heading, form slot, and people slot", () => {
  render(
    <UsersView
      form={<div data-testid="test-form">Form Content</div>}
      people={<div data-testid="test-people">People Content</div>}
    />,
  );

  expect(screen.getByRole("heading", { name: "Users" })).toBeInTheDocument();
  expect(screen.getByTestId("test-form")).toBeInTheDocument();
  expect(screen.getByTestId("test-people")).toBeInTheDocument();
});

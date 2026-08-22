import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { UserList } from "@/components/users/list";

test("shows an empty state when there are no users", () => {
  render(<UserList users={[]} />);

  expect(screen.getByText("No users yet.")).toBeInTheDocument();
});

test("renders each user name and email", () => {
  render(
    <UserList
      users={[
        { email: "ada@example.com", id: "usr_1", name: "Ada" },
        { email: "al@example.com", id: "usr_2", name: "Al" },
      ]}
    />,
  );

  expect(screen.getByRole("cell", { name: "Ada" })).toBeInTheDocument();
  expect(
    screen.getByRole("cell", { name: "ada@example.com" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("cell", { name: "Al" })).toBeInTheDocument();
  expect(
    screen.getByRole("cell", { name: "al@example.com" }),
  ).toBeInTheDocument();
});

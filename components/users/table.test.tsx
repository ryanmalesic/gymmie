import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { userColumns } from "@/components/users/columns";
import { UserTable } from "@/components/users/table";

const users = [
  { email: "zoe@example.com", id: "usr_1", name: "Zoe" },
  { email: "ada@example.com", id: "usr_2", name: "Ada" },
];

afterEach(cleanup);

test("renders column headers and user rows", () => {
  render(<UserTable columns={userColumns} data={users} />);

  expect(screen.getByRole("button", { name: /name/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /email/i })).toBeInTheDocument();
  expect(screen.getByRole("cell", { name: "Zoe" })).toBeInTheDocument();
  expect(
    screen.getByRole("cell", { name: "ada@example.com" }),
  ).toBeInTheDocument();
});

test("filters rows by email", () => {
  render(<UserTable columns={userColumns} data={users} />);

  fireEvent.change(screen.getByPlaceholderText("Filter emails..."), {
    target: { value: "ada@" },
  });

  expect(screen.getByRole("cell", { name: "Ada" })).toBeInTheDocument();
  expect(screen.queryByRole("cell", { name: "Zoe" })).not.toBeInTheDocument();
});

test("sorts rows by name", () => {
  render(<UserTable columns={userColumns} data={users} />);
  fireEvent.click(screen.getByRole("button", { name: /name/i }));

  expect(screen.getAllByRole("row")[1]).toHaveTextContent("Ada");
  expect(screen.getAllByRole("row")[2]).toHaveTextContent("Zoe");
});

test("shows empty state when no data", () => {
  render(<UserTable columns={userColumns} data={[]} />);
  expect(screen.getByText("No users yet.")).toBeInTheDocument();
});

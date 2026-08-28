import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { UserTable, UserTableSkeleton } from "@/components/users/table";
import { userColumns } from "@/components/users/table/columns";

const users = [
  {
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    email: "zoe@example.com",
    emailVerified: false,
    id: "usr_1",
    image: null,
    name: "Zoe",
    updatedAt: new Date("2026-08-01T00:00:00.000Z"),
  },
  {
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    email: "ada@example.com",
    emailVerified: false,
    id: "usr_2",
    image: null,
    name: "Ada",
    updatedAt: new Date("2026-08-01T00:00:00.000Z"),
  },
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

test("keeps filter and headers while rows are loading", () => {
  render(<UserTableSkeleton />);

  expect(screen.getByPlaceholderText("Filter emails...")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /name/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /email/i })).toBeInTheDocument();
  expect(screen.getByRole("status", { name: "Loading people" })).toBeVisible();
});

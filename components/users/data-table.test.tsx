import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { columns } from "@/components/users/columns";
import { DataTable } from "@/components/users/data-table";

afterEach(cleanup);

test("renders column headers when data is present", () => {
  render(
    <DataTable
      columns={columns}
      data={[{ email: "ada@example.com", id: "usr_1", name: "Ada" }]}
    />,
  );

  expect(screen.getByText("Name")).toBeInTheDocument();
  expect(screen.getByText("Email")).toBeInTheDocument();
});

test("renders user rows", () => {
  render(
    <DataTable
      columns={columns}
      data={[
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

test("shows empty state when no data", () => {
  render(<DataTable columns={columns} data={[]} />);

  expect(screen.getByText("No users yet.")).toBeInTheDocument();
});

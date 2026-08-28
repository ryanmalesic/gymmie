import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import {
  userColumns,
  UserTableColumnHeader,
} from "@/components/users/table/columns";

test("renders column headers and defines columns configuration", () => {
  render(<UserTableColumnHeader>Header Title</UserTableColumnHeader>);

  expect(
    screen.getByRole("button", { name: "Header Title" }),
  ).toBeInTheDocument();
  expect(userColumns).toHaveLength(2);
});

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { DashboardHome } from "@/components/dashboard/home";

afterEach(cleanup);

test("welcomes the session user and links to users", () => {
  render(
    <DashboardHome user={{ email: "ada@example.com", name: "Ada Lovelace" }} />,
  );

  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "Welcome back, Ada Lovelace",
  );
  expect(screen.getByRole("link", { name: "View users" })).toHaveAttribute(
    "href",
    "/users",
  );
});

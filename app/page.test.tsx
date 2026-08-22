import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import HomePage from "@/app/page";

afterEach(cleanup);

test("renders the landing page with heading and navigation links", () => {
  render(<HomePage />);

  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Gymmie");
  expect(screen.getByRole("link", { name: "Get started" })).toHaveAttribute(
    "href",
    "/users",
  );
  expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
    "href",
    "/sign-in",
  );
});

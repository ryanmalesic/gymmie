import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { LandingPage } from "@/components/marketing/landing";

afterEach(cleanup);

test("renders the landing page with heading and guest navigation links", () => {
  render(<LandingPage isSignedIn={false} />);

  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Gymmie");
  expect(screen.getByRole("link", { name: "Get started" })).toHaveAttribute(
    "href",
    "/dashboard",
  );
  expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
    "href",
    "/sign-in",
  );
});

test("sends signed-in visitors to the dashboard", () => {
  render(<LandingPage isSignedIn />);

  expect(screen.getByRole("link", { name: "Open dashboard" })).toHaveAttribute(
    "href",
    "/dashboard",
  );
  expect(
    screen.queryByRole("link", { name: "Sign in" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: "Get started" }),
  ).not.toBeInTheDocument();
});

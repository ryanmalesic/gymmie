import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { MarketingHeader } from "@/components/marketing/layout/header";

afterEach(cleanup);

test("links guests to sign-in and the dashboard", () => {
  render(<MarketingHeader isSignedIn={false} />);

  expect(screen.getByRole("link", { name: "Gymmie" })).toHaveAttribute(
    "href",
    "/",
  );
  expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
    "href",
    "/sign-in",
  );
  expect(screen.getByRole("link", { name: "Get started" })).toHaveAttribute(
    "href",
    "/dashboard",
  );
});

test("links signed-in visitors to the dashboard", () => {
  render(<MarketingHeader isSignedIn />);

  expect(screen.getByRole("link", { name: "Open dashboard" })).toHaveAttribute(
    "href",
    "/dashboard",
  );
  expect(
    screen.queryByRole("link", { name: "Sign in" }),
  ).not.toBeInTheDocument();
});

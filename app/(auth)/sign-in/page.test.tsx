import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import SignInRoute from "@/app/(auth)/sign-in/page";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

test("renders the real sign-in route with Google and Apple sign-in options", () => {
  render(<SignInRoute />);

  expect(screen.getByText("Welcome back")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /login with google/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /login with apple/i }),
  ).toBeInTheDocument();
});

import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { SignInForm } from "@/components/sign-in/form";
import { authClient } from "@/lib/auth/client";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("callbackUrl=%2Fdashboard"),
}));

vi.mock("@/lib/auth/client", () => ({
  authClient: {
    signIn: {
      social: vi.fn(),
    },
  },
}));

test("renders sign-in form with apple and google options", () => {
  render(<SignInForm />);

  expect(screen.getByText("Welcome back")).toBeInTheDocument();
  expect(
    screen.getAllByRole("button", { name: /login with apple/i })[0],
  ).toBeInTheDocument();
  expect(
    screen.getAllByRole("button", { name: /login with google/i })[0],
  ).toBeInTheDocument();
});

test("triggers social sign-in when buttons clicked", () => {
  render(<SignInForm />);

  fireEvent.click(
    screen.getAllByRole("button", { name: /login with google/i })[0],
  );
  expect(authClient.signIn.social).toHaveBeenCalledWith(
    { callbackURL: "/dashboard", provider: "google" },
    expect.any(Object),
  );
});

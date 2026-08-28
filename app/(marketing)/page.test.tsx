import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import HomeRoute from "@/app/(marketing)/page";
import { getSession } from "@/lib/auth/session.server";

vi.mock("@/lib/auth/session.server", () => ({
  getSession: vi.fn(),
}));

test("renders real landing page with headline and guest call-to-action", async () => {
  vi.mocked(getSession).mockResolvedValue(null);

  const Page = await HomeRoute();
  render(Page);

  expect(screen.getByRole("heading", { name: "Gymmie" })).toBeInTheDocument();
  expect(
    screen.getByText(
      /Track gym users, manage memberships, and keep your community organized/i,
    ),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
    "href",
    "/sign-in",
  );
  expect(screen.getByRole("link", { name: "Get started" })).toHaveAttribute(
    "href",
    "/dashboard",
  );
});

test("renders real landing page with open dashboard call-to-action when signed in", async () => {
  vi.mocked(getSession).mockResolvedValue({
    session: { expiresAt: new Date(), id: "s1" },
    user: { email: "u@example.com", id: "u1", name: "Alice" },
  } as never);

  const Page = await HomeRoute();
  render(Page);

  expect(screen.getByRole("link", { name: "Open dashboard" })).toHaveAttribute(
    "href",
    "/dashboard",
  );
});

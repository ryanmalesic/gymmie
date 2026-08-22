import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import RootLayout from "@/app/layout";

vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "--font-inter" }),
}));

test("renders children in an English-language document", () => {
  render(
    <RootLayout params={Promise.resolve({})}>
      <p>Hello</p>
    </RootLayout>,
  );

  expect(document.documentElement).toHaveAttribute("lang", "en");
  expect(screen.getByText("Hello")).toBeInTheDocument();
});

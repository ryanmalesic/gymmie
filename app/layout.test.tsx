import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import RootLayout from "@/app/layout";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
}));

test("renders children in an English-language document", () => {
  render(
    <RootLayout>
      <p>Hello</p>
    </RootLayout>,
  );

  expect(document.documentElement).toHaveAttribute("lang", "en");
  expect(screen.getByText("Hello")).toBeInTheDocument();
});

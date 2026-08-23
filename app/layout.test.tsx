import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, vi } from "vitest";

import RootLayout from "@/app/layout";

const rootLayoutSource = readFileSync(
  resolve(process.cwd(), "app/layout.tsx"),
  "utf8",
);

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

// Feature: authenticated-route-layout-refactor, Property 4: Single provider boundary and route availability
test("renders exactly one provider around the complete route tree", () => {
  expect(rootLayoutSource.match(/<QueryProvider\b/g)).toHaveLength(1);
  expect(rootLayoutSource).toMatch(
    /<QueryProvider>\s*\{children\}\s*<\/QueryProvider>/,
  );
});

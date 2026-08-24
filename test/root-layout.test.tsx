import { expect, test, vi } from "vitest";

import RootLayout from "@/app/layout";

vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "--font-inter" }),
}));

test("returns an English-language document containing its children", () => {
  const layout = RootLayout({
    children: <p>Hello</p>,
    params: Promise.resolve({}),
  });

  expect(layout.type).toBe("html");
  expect(layout.props.lang).toBe("en");
  expect(layout.props.children.type).toBe("body");
});

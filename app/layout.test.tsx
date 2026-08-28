import { expect, test, vi } from "vitest";

import RootLayout from "@/app/layout";

vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "--font-inter" }),
}));

vi.mock("@vercel/analytics/next", () => ({
  Analytics: function Analytics() {
    return <div data-testid="vercel-analytics" />;
  },
}));

vi.mock("@vercel/speed-insights/next", () => ({
  SpeedInsights: function SpeedInsights() {
    return <div data-testid="vercel-speed-insights" />;
  },
}));

test("returns an English-language document containing its children", () => {
  const layout = RootLayout({
    children: <p>Hello</p>,
    params: Promise.resolve({}),
  });

  expect(layout.type).toBe("html");
  expect(layout.props.lang).toBe("en");
  expect(layout.props.children.type).toBe("body");

  const bodyChildren = layout.props.children.props.children as Array<{
    type: { name?: string };
  }>;
  const childNames = bodyChildren.map((child) => child.type.name);

  expect(childNames).toContain("Analytics");
  expect(childNames).toContain("SpeedInsights");
});

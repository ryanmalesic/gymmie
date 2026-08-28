import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { MarketingLayout } from "@/components/marketing/layout";

test("renders marketing layout with header, footer, and children", () => {
  render(
    <MarketingLayout isSignedIn={false}>
      <div data-testid="child-content">Body Content</div>
    </MarketingLayout>,
  );

  expect(screen.getByRole("banner")).toBeInTheDocument();
  expect(screen.getByTestId("child-content")).toBeInTheDocument();
  expect(screen.getByRole("contentinfo")).toBeInTheDocument();
});

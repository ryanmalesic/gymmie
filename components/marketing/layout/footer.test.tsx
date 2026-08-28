import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { MarketingFooter } from "@/components/marketing/layout/footer";

test("renders marketing footer branding", () => {
  render(<MarketingFooter />);

  expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  expect(screen.getByText("Gymmie")).toBeInTheDocument();
});

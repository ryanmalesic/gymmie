import { render } from "@testing-library/react";
import { expect, test } from "vitest";

import { AppleIcon } from "@/components/sign-in/form/apple-icon";

test("renders the Apple SVG icon", () => {
  const { container } = render(<AppleIcon />);
  const svg = container.querySelector("svg");
  expect(svg).toBeInTheDocument();
});

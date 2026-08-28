import { render } from "@testing-library/react";
import { expect, test } from "vitest";

import { GoogleIcon } from "@/components/sign-in/form/google-icon";

test("renders the Google SVG icon", () => {
  const { container } = render(<GoogleIcon />);
  const svg = container.querySelector("svg");
  expect(svg).toBeInTheDocument();
});

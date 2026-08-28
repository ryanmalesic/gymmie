import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { QueryProvider } from "@/lib/query/providers";

test("renders query provider wrapping children", () => {
  render(
    <QueryProvider>
      <div data-testid="child-node">Provider Child</div>
    </QueryProvider>,
  );

  expect(screen.getByTestId("child-node")).toBeInTheDocument();
});

import { expect, test } from "vitest";

import { cn } from "@/lib/utils";

test("merges tailwind class names properly", () => {
  expect(cn("px-2 py-1", "bg-blue-500")).toBe("px-2 py-1 bg-blue-500");
  expect(cn("px-2", false && "hidden", "px-4")).toBe("px-4");
});

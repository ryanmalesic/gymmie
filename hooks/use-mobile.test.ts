import { renderHook } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { useIsMobile } from "@/hooks/use-mobile";

test("useIsMobile returns boolean based on window breakpoint", () => {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    addEventListener: vi.fn(),
    matches: false,
    media: query,
    onchange: null,
    removeEventListener: vi.fn(),
  }));

  const { result } = renderHook(() => useIsMobile());
  expect(typeof result.current).toBe("boolean");
});

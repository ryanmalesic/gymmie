import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

vi.mock("server-only", () => ({}));

class ResizeObserverMock {
  disconnect() {}
  observe() {}
  unobserve() {}
}

Object.defineProperty(window, "ResizeObserver", {
  value: ResizeObserverMock,
  writable: true,
});

Element.prototype.scrollIntoView = vi.fn();

Object.defineProperty(window, "matchMedia", {
  value: vi.fn().mockImplementation((query: string) => ({
    addEventListener: vi.fn(),
    addListener: vi.fn(),
    dispatchEvent: vi.fn(),
    matches: false,
    media: query,
    onchange: null,
    removeEventListener: vi.fn(),
    removeListener: vi.fn(),
  })),
  writable: true,
});

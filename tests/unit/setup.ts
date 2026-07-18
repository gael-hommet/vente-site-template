import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Ensure a clean DOM between component tests.
afterEach(() => {
  cleanup();
});

// jsdom lacks matchMedia; provide a controllable stub so reduced-motion and
// responsive hooks can be tested deterministically.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// jsdom lacks ResizeObserver / IntersectionObserver used by animation hooks.
class MockObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
const g = globalThis as unknown as Record<string, unknown>;
g.ResizeObserver ||= MockObserver;
g.IntersectionObserver ||= MockObserver;

// jsdom lacks the SVG geometry API used by dash-offset draw-on animations.
// Real browsers always provide it; stub it so component tests can mount SVG
// draw-in animations without a "Not implemented" crash.
type SvgGeom = { getTotalLength?: () => number };
const svgProto = (globalThis as { SVGElement?: { prototype: SvgGeom } }).SVGElement?.prototype;
if (svgProto && typeof svgProto.getTotalLength !== "function") {
  svgProto.getTotalLength = () => 100;
}

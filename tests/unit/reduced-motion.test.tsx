import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  REDUCED_MOTION_QUERY,
  prefersReducedMotion,
} from "@/lib/accessibility/reduced-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const originalMatchMedia = window.matchMedia;

/** Stub matchMedia so it reports `matches` for queries in `matching`. */
function stubMatchMedia(matching: (query: string) => boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: matching(query),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

function ReducedMotionProbe() {
  const reduced = useReducedMotion();
  return <span data-testid="probe">{reduced ? "reduced" : "full"}</span>;
}

function MediaQueryProbe({ query }: { query: string }) {
  const matches = useMediaQuery(query);
  return <span data-testid="probe">{matches ? "match" : "no-match"}</span>;
}

describe("REDUCED_MOTION_QUERY", () => {
  it("targets the standard prefers-reduced-motion media feature", () => {
    expect(REDUCED_MOTION_QUERY).toBe("(prefers-reduced-motion: reduce)");
  });
});

describe("prefersReducedMotion", () => {
  it("returns false when the query does not match (default stub)", () => {
    expect(prefersReducedMotion()).toBe(false);
  });

  it("returns true when the reduced-motion query matches", () => {
    stubMatchMedia((query) => query === REDUCED_MOTION_QUERY);
    expect(prefersReducedMotion()).toBe(true);
  });
});

describe("useReducedMotion", () => {
  it("returns false by default (matchMedia stub matches:false)", () => {
    render(<ReducedMotionProbe />);
    expect(screen.getByTestId("probe")).toHaveTextContent("full");
  });

  it("returns true when the reduced-motion query matches", () => {
    stubMatchMedia((query) => query === REDUCED_MOTION_QUERY);
    render(<ReducedMotionProbe />);
    expect(screen.getByTestId("probe")).toHaveTextContent("reduced");
  });
});

describe("useMediaQuery", () => {
  it("honors the exact query string it is given", () => {
    stubMatchMedia((query) => query === "(min-width: 768px)");
    render(<MediaQueryProbe query="(min-width: 768px)" />);
    expect(screen.getByTestId("probe")).toHaveTextContent("match");
  });

  it("returns false for a non-matching query", () => {
    stubMatchMedia(() => false);
    render(<MediaQueryProbe query="(min-width: 768px)" />);
    expect(screen.getByTestId("probe")).toHaveTextContent("no-match");
  });
});

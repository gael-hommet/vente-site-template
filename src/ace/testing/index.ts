import { vi } from "vitest";
import type { DeviceProfile, QualityTier } from "@/types";

/**
 * ace-testing — helpers for the Vitest suites. TEST-ONLY MODULE: never import
 * it from app code (it depends on vitest, which is not in the app bundle).
 */

export { __setWebGLForTesting } from "@/lib/three/webgl";

/**
 * Installs a matchMedia stub where the provided queries match. Complements the
 * global stub from tests/unit/setup.ts (which always returns matches:false).
 *
 *   mockMatchMedia(["(prefers-reduced-motion: reduce)"]);
 */
export function mockMatchMedia(matchingQueries: readonly string[]): void {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: matchingQueries.includes(query),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

/** Shorthand for the most common case. */
export function mockReducedMotion(reduced: boolean): void {
  mockMatchMedia(reduced ? ["(prefers-reduced-motion: reduce)"] : []);
}

/** Deterministic DeviceProfile fixture for tier-dependent components. */
export function makeDeviceProfile(overrides: Partial<DeviceProfile> = {}): DeviceProfile {
  return {
    tier: "BALANCED" as QualityTier,
    webgl: true,
    reducedMotion: false,
    saveData: false,
    coarsePointer: false,
    deviceMemoryGb: 8,
    hardwareConcurrency: 8,
    dpr: 1.5,
    ...overrides,
  };
}

import type { DeviceProfile, QualityTier } from "@/types";
import { detectWebGL } from "@/lib/three/webgl";
import { prefersReducedMotion } from "@/lib/accessibility/reduced-motion";

/**
 * Device capability probing + quality-tier selection.
 *
 * The tiers gate everything expensive: DPR, postprocessing, texture budgets,
 * whether true WebGL runs at all vs. a lighter media fallback.
 */

interface NavigatorWithExtras extends Navigator {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
}

export function detectDeviceProfile(): DeviceProfile {
  if (typeof window === "undefined") {
    // Server: assume the safest tier so nothing heavy is emitted during SSR.
    return {
      tier: "LITE",
      webgl: false,
      reducedMotion: false,
      saveData: false,
      coarsePointer: false,
      deviceMemoryGb: null,
      hardwareConcurrency: null,
      dpr: 1,
    };
  }

  const nav = navigator as NavigatorWithExtras;
  const webgl = detectWebGL();
  const reducedMotion = prefersReducedMotion();
  const saveData = Boolean(nav.connection?.saveData);
  const coarsePointer = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  const deviceMemoryGb = typeof nav.deviceMemory === "number" ? nav.deviceMemory : null;
  const hardwareConcurrency =
    typeof nav.hardwareConcurrency === "number" ? nav.hardwareConcurrency : null;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const tier = pickTier({
    webgl,
    reducedMotion,
    saveData,
    coarsePointer,
    deviceMemoryGb,
    hardwareConcurrency,
  });

  return {
    tier,
    webgl,
    reducedMotion,
    saveData,
    coarsePointer,
    deviceMemoryGb,
    hardwareConcurrency,
    dpr: tier === "ULTRA" ? dpr : Math.min(dpr, tier === "BALANCED" ? 1.75 : 1),
  };
}

interface TierInputs {
  webgl: boolean;
  reducedMotion: boolean;
  saveData: boolean;
  coarsePointer: boolean;
  deviceMemoryGb: number | null;
  hardwareConcurrency: number | null;
}

export function pickTier(i: TierInputs): QualityTier {
  // Hard downgrades: anything that says "keep it light" wins.
  if (!i.webgl || i.reducedMotion || i.saveData) return "LITE";
  if (i.deviceMemoryGb !== null && i.deviceMemoryGb <= 2) return "LITE";

  // Balanced: mobile / mid devices.
  if (i.coarsePointer) return "BALANCED";
  if (i.deviceMemoryGb !== null && i.deviceMemoryGb <= 4) return "BALANCED";
  if (i.hardwareConcurrency !== null && i.hardwareConcurrency <= 4) return "BALANCED";

  // Otherwise, a capable desktop.
  return "ULTRA";
}

/** Per-tier rendering budget consumed by ThreeCanvas / PerformanceController. */
export interface QualityBudget {
  dpr: [number, number];
  antialias: boolean;
  shadows: boolean;
  postprocessing: boolean;
  maxTextureSize: number;
  targetFps: number;
}

export const QUALITY_BUDGETS: Record<QualityTier, QualityBudget> = {
  ULTRA: {
    dpr: [1, 2],
    antialias: true,
    shadows: true,
    postprocessing: true,
    maxTextureSize: 2048,
    targetFps: 60,
  },
  BALANCED: {
    dpr: [1, 1.5],
    antialias: true,
    shadows: false,
    postprocessing: false,
    maxTextureSize: 1024,
    targetFps: 60,
  },
  LITE: {
    dpr: [1, 1],
    antialias: false,
    shadows: false,
    postprocessing: false,
    maxTextureSize: 512,
    targetFps: 30,
  },
};

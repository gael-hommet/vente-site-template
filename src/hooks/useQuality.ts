"use client";

import { useQualityStore } from "@/lib/performance/store";
import { QUALITY_BUDGETS, type QualityBudget } from "@/lib/performance/quality";
import type { DeviceProfile, QualityTier } from "@/types";

export interface QualityInfo {
  tier: QualityTier;
  budget: QualityBudget;
  profile: DeviceProfile;
  detected: boolean;
  override: QualityTier | null;
  setOverride: (tier: QualityTier | null) => void;
}

/** Read the active quality tier + its rendering budget from anywhere. */
export function useQuality(): QualityInfo {
  const tier = useQualityStore((s) => s.tier);
  const profile = useQualityStore((s) => s.profile);
  const detected = useQualityStore((s) => s.detected);
  const override = useQualityStore((s) => s.override);
  const setOverride = useQualityStore((s) => s.setOverride);
  return { tier, budget: QUALITY_BUDGETS[tier], profile, detected, override, setOverride };
}

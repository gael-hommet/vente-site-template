import { create } from "zustand";
import type { DeviceProfile, QualityTier } from "@/types";
import { detectDeviceProfile } from "./quality";

interface QualityState {
  profile: DeviceProfile;
  /** True once real device detection has run on the client. */
  detected: boolean;
  /** User override from the ULTRA/BALANCED/LITE selector (lab + optional UI). */
  override: QualityTier | null;
  /** The tier actually in effect (override ?? detected). */
  tier: QualityTier;
  detect: () => void;
  setOverride: (tier: QualityTier | null) => void;
}

const SSR_PROFILE: DeviceProfile = {
  tier: "LITE",
  webgl: false,
  reducedMotion: false,
  saveData: false,
  coarsePointer: false,
  deviceMemoryGb: null,
  hardwareConcurrency: null,
  dpr: 1,
};

export const useQualityStore = create<QualityState>((set, get) => ({
  profile: SSR_PROFILE,
  detected: false,
  override: null,
  tier: "LITE",
  detect: () => {
    const profile = detectDeviceProfile();
    const { override } = get();
    set({ profile, detected: true, tier: override ?? profile.tier });
  },
  setOverride: (override) => {
    const { profile } = get();
    set({ override, tier: override ?? profile.tier });
  },
}));

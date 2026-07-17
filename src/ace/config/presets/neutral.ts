import type { DesignLanguagePreset } from "../design-language";

/**
 * "Neutral" — the engine's default. Values mirror globals.css exactly, so
 * applying this preset is a no-op: it exists to make the default an explicit,
 * inspectable member of the Design Language rather than an invisible baseline.
 */
export const neutralPreset: DesignLanguagePreset = {
  id: "neutral",
  title: "Neutre",
  description:
    "Accent indigo neutre du moteur — point de départ avant direction artistique client.",
  motionCharacter: "calme",
  light: {
    brand: "oklch(0.54 0.19 265)",
    brandStrong: "oklch(0.46 0.2 265)",
    brandForeground: "oklch(0.99 0.01 265)",
    ring: "oklch(0.6 0.15 265)",
    shadowGlow: "0 0 40px oklch(0.54 0.19 265 / 0.35)",
  },
  dark: {
    brand: "oklch(0.72 0.17 265)",
    brandStrong: "oklch(0.8 0.15 265)",
    brandForeground: "oklch(0.16 0.02 265)",
    ring: "oklch(0.72 0.15 265)",
    shadowGlow: "0 0 40px oklch(0.72 0.17 265 / 0.35)",
  },
};

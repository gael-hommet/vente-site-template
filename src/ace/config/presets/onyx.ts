import type { DesignLanguagePreset } from "../design-language";

/**
 * "Onyx" — luxe sombre : accent champagne/or sur surfaces profondes. Pensé pour
 * l'automobile premium, l'horlogerie, l'immobilier haut de gamme.
 */
export const onyxPreset: DesignLanguagePreset = {
  id: "onyx",
  title: "Onyx",
  description: "Luxe sobre — accent champagne doré, rayons resserrés, mouvement cinématique.",
  motionCharacter: "cinematique",
  light: {
    brand: "oklch(0.68 0.11 85)",
    brandStrong: "oklch(0.58 0.12 80)",
    brandForeground: "oklch(0.18 0.02 80)",
    ring: "oklch(0.62 0.1 85)",
    shadowGlow: "0 0 40px oklch(0.68 0.11 85 / 0.3)",
  },
  dark: {
    brand: "oklch(0.78 0.1 88)",
    brandStrong: "oklch(0.85 0.08 90)",
    brandForeground: "oklch(0.17 0.02 85)",
    ring: "oklch(0.78 0.09 88)",
    shadowGlow: "0 0 46px oklch(0.78 0.1 88 / 0.32)",
  },
  radius: { sm: "0.375rem", md: "0.5rem", lg: "0.75rem", xl: "1rem" },
  recommends: {
    displayFont: "serif à empattements fins (ex. Fraunces, Cormorant)",
    pairing: "display serif + sans géométrique",
  },
};

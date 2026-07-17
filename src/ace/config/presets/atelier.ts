import type { DesignLanguagePreset } from "../design-language";

/**
 * "Atelier" — chaleureux artisanal : terracotta/cuivre, rayons généreux. Pensé
 * pour les métiers de bouche, l'artisanat, l'hôtellerie de caractère.
 */
export const atelierPreset: DesignLanguagePreset = {
  id: "atelier",
  title: "Atelier",
  description: "Chaleur artisanale — accent terracotta cuivré, formes rondes, mouvement vif.",
  motionCharacter: "vif",
  light: {
    brand: "oklch(0.54 0.14 45)",
    brandStrong: "oklch(0.5 0.15 40)",
    brandForeground: "oklch(0.98 0.01 45)",
    ring: "oklch(0.58 0.12 45)",
    shadowGlow: "0 0 40px oklch(0.6 0.14 45 / 0.3)",
  },
  dark: {
    brand: "oklch(0.72 0.13 50)",
    brandStrong: "oklch(0.8 0.11 55)",
    brandForeground: "oklch(0.18 0.03 45)",
    ring: "oklch(0.72 0.12 50)",
    shadowGlow: "0 0 44px oklch(0.72 0.13 50 / 0.3)",
  },
  radius: { sm: "0.625rem", md: "1rem", lg: "1.375rem", xl: "2rem" },
  recommends: {
    displayFont: "sans humaniste expressive (ex. Bricolage Grotesque)",
    pairing: "display expressive + sans neutre",
  },
};

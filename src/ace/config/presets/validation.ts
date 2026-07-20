import type { DesignLanguagePreset } from "../design-language";

/**
 * Profils Design Language NEUTRES de validation. Ils servent UNIQUEMENT à tester
 * le moteur (variabilité profonde du Design Language) — ce ne sont pas des sites
 * clients prêts à vendre et ils n'imposent aucune esthétique. Chacun change
 * brand + surfaces (clair/sombre) + rayons + ombres + densité : une même recette
 * rendue sous deux de ces profils est perceptiblement différente.
 */

export const editorialLight: DesignLanguagePreset = {
  id: "editorial-light",
  title: "Editorial Light",
  description: "Papier chaud, encre, accent ardoise. Rayons doux, composition aérée.",
  motionCharacter: "calme",
  light: {
    brand: "oklch(0.48 0.13 265)",
    brandStrong: "oklch(0.4 0.14 265)",
    brandForeground: "oklch(0.98 0.01 265)",
    ring: "oklch(0.52 0.13 265)",
  },
  dark: {
    brand: "oklch(0.72 0.13 265)",
    brandStrong: "oklch(0.8 0.11 265)",
    brandForeground: "oklch(0.18 0.02 265)",
  },
  surfaces: {
    light: {
      background: "oklch(0.98 0.006 85)",
      foreground: "oklch(0.22 0.01 70)",
      surface: "oklch(1 0 0)",
      surface2: "oklch(0.96 0.006 85)",
      surface3: "oklch(0.92 0.008 85)",
      muted: "oklch(0.46 0.02 70)",
      border: "oklch(0.88 0.01 80)",
    },
    dark: {
      background: "oklch(0.19 0.012 265)",
      foreground: "oklch(0.95 0.008 250)",
      surface: "oklch(0.23 0.015 265)",
      surface2: "oklch(0.27 0.016 265)",
      surface3: "oklch(0.31 0.018 265)",
      muted: "oklch(0.74 0.02 255)",
      border: "oklch(0.35 0.02 265)",
    },
  },
  radius: { sm: "0.5rem", md: "0.75rem", lg: "1rem", xl: "1.5rem" },
  density: { contentWidth: "72rem", sectionSpace: "7rem" },
};

export const precisionDark: DesignLanguagePreset = {
  id: "precision-dark",
  title: "Precision Dark",
  description: "Quasi-noir froid, accent cyan, angles nets, ombres dures.",
  motionCharacter: "cinematique",
  light: {
    brand: "oklch(0.5 0.13 230)",
    brandStrong: "oklch(0.42 0.14 230)",
    brandForeground: "oklch(0.98 0.01 230)",
    ring: "oklch(0.55 0.13 230)",
  },
  dark: {
    brand: "oklch(0.78 0.13 220)",
    brandStrong: "oklch(0.85 0.11 220)",
    brandForeground: "oklch(0.16 0.02 230)",
  },
  surfaces: {
    light: {
      background: "oklch(0.97 0.003 250)",
      foreground: "oklch(0.18 0.01 250)",
      surface: "oklch(1 0 0)",
      surface2: "oklch(0.95 0.004 250)",
      surface3: "oklch(0.9 0.006 250)",
      muted: "oklch(0.44 0.015 250)",
      border: "oklch(0.86 0.008 250)",
    },
    dark: {
      background: "oklch(0.15 0.01 250)",
      foreground: "oklch(0.96 0.005 240)",
      surface: "oklch(0.19 0.012 250)",
      surface2: "oklch(0.23 0.014 250)",
      surface3: "oklch(0.27 0.016 250)",
      muted: "oklch(0.7 0.02 245)",
      border: "oklch(0.32 0.018 250)",
    },
  },
  radius: { sm: "0.125rem", md: "0.25rem", lg: "0.375rem", xl: "0.5rem" },
  shadows: {
    sm: "0 1px 0 oklch(0 0 0 / 0.4)",
    md: "0 2px 0 oklch(0 0 0 / 0.5)",
    lg: "8px 8px 0 oklch(0 0 0 / 0.3)",
  },
  density: { contentWidth: "68rem", sectionSpace: "5rem" },
};

export const organicWarm: DesignLanguagePreset = {
  id: "organic-warm",
  title: "Organic Warm",
  description: "Sable chaud, accent terre/olive, rayons moyens, matière.",
  motionCharacter: "calme",
  light: {
    brand: "oklch(0.5 0.12 55)",
    brandStrong: "oklch(0.42 0.12 50)",
    brandForeground: "oklch(0.98 0.01 80)",
    ring: "oklch(0.54 0.12 55)",
  },
  dark: {
    brand: "oklch(0.75 0.11 60)",
    brandStrong: "oklch(0.82 0.09 62)",
    brandForeground: "oklch(0.2 0.02 55)",
  },
  surfaces: {
    light: {
      background: "oklch(0.97 0.014 70)",
      foreground: "oklch(0.25 0.02 50)",
      surface: "oklch(0.99 0.01 75)",
      surface2: "oklch(0.94 0.018 65)",
      surface3: "oklch(0.9 0.022 60)",
      muted: "oklch(0.47 0.03 55)",
      border: "oklch(0.86 0.02 65)",
    },
    dark: {
      background: "oklch(0.21 0.018 55)",
      foreground: "oklch(0.94 0.012 70)",
      surface: "oklch(0.25 0.02 55)",
      surface2: "oklch(0.29 0.022 55)",
      surface3: "oklch(0.33 0.024 52)",
      muted: "oklch(0.74 0.03 60)",
      border: "oklch(0.37 0.025 55)",
    },
  },
  radius: { sm: "0.375rem", md: "0.625rem", lg: "0.875rem", xl: "1.25rem" },
  density: { contentWidth: "68rem", sectionSpace: "6rem" },
};

export const technicalCool: DesignLanguagePreset = {
  id: "technical-cool",
  title: "Technical Cool",
  description: "Gris froid, accent bleu électrique, petits rayons, net.",
  motionCharacter: "vif",
  light: {
    brand: "oklch(0.52 0.18 255)",
    brandStrong: "oklch(0.44 0.19 255)",
    brandForeground: "oklch(0.99 0.01 255)",
    ring: "oklch(0.55 0.17 255)",
  },
  dark: {
    brand: "oklch(0.72 0.16 255)",
    brandStrong: "oklch(0.8 0.14 255)",
    brandForeground: "oklch(0.16 0.02 255)",
  },
  surfaces: {
    light: {
      background: "oklch(0.98 0.003 240)",
      foreground: "oklch(0.2 0.012 250)",
      surface: "oklch(1 0 0)",
      surface2: "oklch(0.96 0.004 240)",
      surface3: "oklch(0.92 0.006 240)",
      muted: "oklch(0.45 0.02 250)",
      border: "oklch(0.88 0.008 240)",
    },
    dark: {
      background: "oklch(0.17 0.012 250)",
      foreground: "oklch(0.96 0.006 240)",
      surface: "oklch(0.21 0.014 250)",
      surface2: "oklch(0.25 0.016 250)",
      surface3: "oklch(0.29 0.018 250)",
      muted: "oklch(0.71 0.02 248)",
      border: "oklch(0.33 0.018 250)",
    },
  },
  radius: { sm: "0.25rem", md: "0.375rem", lg: "0.5rem", xl: "0.75rem" },
  density: { contentWidth: "64rem", sectionSpace: "4rem" },
};

export const luxuryMinimal: DesignLanguagePreset = {
  id: "luxury-minimal",
  title: "Luxury Minimal",
  description: "Contraste élevé, accent champagne, rayons minimaux, grands blancs.",
  motionCharacter: "calme",
  light: {
    brand: "oklch(0.68 0.1 88)",
    brandStrong: "oklch(0.5 0.1 85)",
    brandForeground: "oklch(0.18 0.02 85)",
    ring: "oklch(0.62 0.1 88)",
  },
  dark: {
    brand: "oklch(0.82 0.09 90)",
    brandStrong: "oklch(0.88 0.07 90)",
    brandForeground: "oklch(0.16 0.02 88)",
  },
  surfaces: {
    light: {
      background: "oklch(0.99 0.002 90)",
      foreground: "oklch(0.16 0.006 80)",
      surface: "oklch(1 0 0)",
      surface2: "oklch(0.97 0.003 90)",
      surface3: "oklch(0.93 0.004 88)",
      muted: "oklch(0.44 0.01 80)",
      border: "oklch(0.89 0.005 85)",
    },
    dark: {
      background: "oklch(0.13 0.006 85)",
      foreground: "oklch(0.97 0.004 90)",
      surface: "oklch(0.17 0.008 85)",
      surface2: "oklch(0.21 0.01 85)",
      surface3: "oklch(0.25 0.012 85)",
      muted: "oklch(0.72 0.015 88)",
      border: "oklch(0.3 0.012 85)",
    },
  },
  radius: { sm: "0.125rem", md: "0.25rem", lg: "0.375rem", xl: "0.5rem" },
  density: { contentWidth: "70rem", sectionSpace: "8rem" },
};

/** Tous les profils de validation (fixtures moteur). */
export const VALIDATION_PRESETS: readonly DesignLanguagePreset[] = [
  editorialLight,
  precisionDark,
  organicWarm,
  technicalCool,
  luxuryMinimal,
];

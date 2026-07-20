import { z } from "zod";

/**
 * Design Language — the configurable art-direction layer of ACE.
 *
 * A preset overrides ONLY the CSS custom properties that globals.css already
 * declares (--brand-*, ring, glow, radii, durations). It never introduces new
 * token names, so every component keeps working under every preset.
 *
 * Fonts are intentionally NOT part of the runtime preset: `next/font` loads at
 * build time, so the display/sans font choice is a generator-time decision
 * (`ace:new-site`), recorded in the preset as a recommendation only.
 */

/** Loose oklch() validator — catches typos, not colorimetry. */
const oklchColor = z
  .string()
  .regex(/^oklch\(\s*[\d.]+%?\s+[\d.]+\s+[\d.]+(\s*\/\s*[\d.%]+)?\s*\)$/, "expected oklch(L C H)");

const brandTokensSchema = z.object({
  brand: oklchColor,
  brandStrong: oklchColor,
  brandForeground: oklchColor,
  /** Focus ring; defaults to brand if omitted. */
  ring: oklchColor.optional(),
  /** Glow shadow color+alpha, full CSS shadow value. */
  shadowGlow: z.string().optional(),
});

/**
 * Palette de surfaces (fond, encre, surfaces, muted, bordure). Permet à une DA
 * de changer PROFONDÉMENT l'ambiance (clair chaud vs sombre précis…) : les mêmes
 * composants, pilotés par ces tokens, rendent alors très différemment.
 */
const surfaceTokensSchema = z.object({
  background: oklchColor,
  foreground: oklchColor,
  surface: oklchColor,
  surface2: oklchColor,
  surface3: oklchColor,
  muted: oklchColor,
  border: oklchColor,
});

export const designLanguageSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  title: z.string().min(2),
  /** One-line intent of the art direction, shown in ACE Lab. */
  description: z.string().min(10),
  /** Overall motion character; the Motion Library reads this as a default. */
  motionCharacter: z.enum(["calme", "vif", "cinematique"]),
  light: brandTokensSchema,
  dark: brandTokensSchema,
  /** Optional radius scale override (rem values), e.g. sharper luxe look. */
  radius: z
    .object({
      sm: z.string(),
      md: z.string(),
      lg: z.string(),
      xl: z.string(),
    })
    .partial()
    .optional(),
  /** Palette de surfaces par thème (ambiance profonde). Optionnel. */
  surfaces: z
    .object({
      light: surfaceTokensSchema,
      dark: surfaceTokensSchema,
    })
    .optional(),
  /** Ombres (élévation) : dures vs douces. Valeurs CSS complètes. Optionnel. */
  shadows: z
    .object({
      sm: z.string(),
      md: z.string(),
      lg: z.string(),
    })
    .partial()
    .optional(),
  /**
   * Densité de composition : largeur de contenu + rythme vertical de section.
   * Émis en tokens `--content-width` / `--section-space` que les layouts et
   * recipes peuvent adopter. Optionnel.
   */
  density: z
    .object({
      contentWidth: z.string().optional(),
      sectionSpace: z.string().optional(),
    })
    .optional(),
  /** Generator-time recommendations (not applied at runtime). */
  recommends: z
    .object({
      displayFont: z.string().optional(),
      pairing: z.string().optional(),
      /** Échelle typographique recommandée (appliquée à la génération). */
      typeScale: z.string().optional(),
    })
    .optional(),
});

export type DesignLanguagePreset = z.infer<typeof designLanguageSchema>;
export type BrandTokens = z.infer<typeof brandTokensSchema>;
export type SurfaceTokens = z.infer<typeof surfaceTokensSchema>;

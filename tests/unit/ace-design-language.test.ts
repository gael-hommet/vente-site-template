import { describe, expect, it } from "vitest";
import {
  DESIGN_PRESETS,
  designLanguageSchema,
  getDesignPreset,
  presetToCss,
  oklchToSrgb,
  contrastRatio,
  compositeOver,
} from "@/ace/config";

describe("ace-config design language", () => {
  it("ships at least the neutral, onyx and atelier presets, all schema-valid", () => {
    const ids = DESIGN_PRESETS.map((p) => p.id);
    expect(ids).toEqual(expect.arrayContaining(["neutral", "onyx", "atelier"]));
    for (const preset of DESIGN_PRESETS) {
      expect(() => designLanguageSchema.parse(preset)).not.toThrow();
    }
  });

  it("rejects non-oklch brand colors", () => {
    const bad = structuredClone(getDesignPreset("onyx"));
    bad.light.brand = "#ff0000";
    expect(() => designLanguageSchema.parse(bad)).toThrow();
  });

  it("resolves a preset to CSS covering light, explicit dark and system dark", () => {
    const css = presetToCss(getDesignPreset("onyx"));
    expect(css).toContain(":root{");
    expect(css).toContain(':root[data-theme="dark"]{');
    expect(css).toContain("@media (prefers-color-scheme: dark)");
    expect(css).toContain("--brand:");
    expect(css).toContain("--brand-strong:");
    expect(css).toContain("--brand-foreground:");
  });

  it("only overrides tokens that globals.css already declares", () => {
    for (const preset of DESIGN_PRESETS) {
      const css = presetToCss(preset);
      const declared = [...css.matchAll(/(--[a-z-]+):/g)].map((m) => m[1]);
      const allowed = [
        "--brand",
        "--brand-strong",
        "--brand-foreground",
        "--ring",
        "--shadow-glow",
        "--radius-sm",
        "--radius-md",
        "--radius-lg",
        "--radius-xl",
        // Axes profonds (surfaces / ombres / densité) — tous déclarés dans globals.css.
        "--background",
        "--foreground",
        "--surface",
        "--surface-2",
        "--surface-3",
        "--muted",
        "--border",
        "--shadow-sm",
        "--shadow-md",
        "--shadow-lg",
        "--content-width",
        "--section-space",
      ];
      for (const token of declared) {
        expect(allowed).toContain(token);
      }
    }
  });

  it("neutral mirrors the globals.css defaults (applying it is a no-op)", () => {
    const neutral = getDesignPreset("neutral");
    expect(neutral.light.brand).toBe("oklch(0.54 0.19 265)");
    expect(neutral.dark.brand).toBe("oklch(0.72 0.17 265)");
  });
});

describe("Design Language — AA by construction", () => {
  // Surfaces the presets sit on (mirrors globals.css).
  const LIGHT_SURFACE = oklchToSrgb("oklch(1 0 0)");
  const DARK_SURFACE = oklchToSrgb("oklch(0.2 0.018 265)");

  for (const preset of DESIGN_PRESETS) {
    describe(`preset "${preset.id}"`, () => {
      it("keeps button text readable on the brand color (light)", () => {
        const ratio = contrastRatio(
          oklchToSrgb(preset.light.brandForeground),
          oklchToSrgb(preset.light.brand),
        );
        expect(ratio).toBeGreaterThanOrEqual(4.7);
      });

      it("keeps brand-strong readable as text on light surfaces and tints", () => {
        const strong = oklchToSrgb(preset.light.brandStrong);
        expect(contrastRatio(strong, LIGHT_SURFACE)).toBeGreaterThanOrEqual(4.7);
        // Badge case: brand-strong text on a 12% brand tint over white.
        const tint = compositeOver(oklchToSrgb(preset.light.brand), 0.12, LIGHT_SURFACE);
        expect(contrastRatio(strong, tint)).toBeGreaterThanOrEqual(4.7);
      });

      it("keeps button text readable on the brand color (dark)", () => {
        const ratio = contrastRatio(
          oklchToSrgb(preset.dark.brandForeground),
          oklchToSrgb(preset.dark.brand),
        );
        expect(ratio).toBeGreaterThanOrEqual(4.7);
      });

      it("keeps brand-strong readable as text on dark surfaces", () => {
        const strong = oklchToSrgb(preset.dark.brandStrong);
        expect(contrastRatio(strong, DARK_SURFACE)).toBeGreaterThanOrEqual(4.7);
      });
    });
  }
});

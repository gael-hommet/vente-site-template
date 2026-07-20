import { describe, it, expect } from "vitest";
import {
  VALIDATION_PRESETS,
  presetToCss,
  contrastRatio,
  oklchToSrgb,
  getDesignPreset,
} from "@/ace/config";

describe("Design Language — axes profonds & profils de validation", () => {
  it("les 5 profils de validation sont enregistrés et résolvables", () => {
    for (const p of VALIDATION_PRESETS) {
      expect(getDesignPreset(p.id).id).toBe(p.id);
    }
    expect(VALIDATION_PRESETS.length).toBe(5);
  });

  it("presetToCss émet les surfaces, rayons, densité (et ombres si définies)", () => {
    const css = presetToCss(getDesignPreset("precision-dark"));
    // Surfaces (clair + sombre)
    expect(css).toContain("--background:");
    expect(css).toContain("--surface-2:");
    expect(css).toContain("--muted:");
    // Rayons + densité
    expect(css).toContain("--radius-md:");
    expect(css).toContain("--content-width:");
    // Ombres dures (précision)
    expect(css).toContain("--shadow-lg:");
  });

  it("deux profils différents produisent un CSS différent (variabilité réelle)", () => {
    const a = presetToCss(getDesignPreset("editorial-light"));
    const b = presetToCss(getDesignPreset("precision-dark"));
    const c = presetToCss(getDesignPreset("organic-warm"));
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
    expect(b).not.toBe(c);
  });

  it("chaque profil de validation respecte l'AA sur ses surfaces (clair + sombre)", () => {
    for (const p of VALIDATION_PRESETS) {
      const s = p.surfaces!;
      // Texte principal sur fond : très lisible (≥ 7:1).
      expect(
        contrastRatio(oklchToSrgb(s.light.foreground), oklchToSrgb(s.light.background)),
        `${p.id} light fg/bg`,
      ).toBeGreaterThanOrEqual(7);
      expect(
        contrastRatio(oklchToSrgb(s.dark.foreground), oklchToSrgb(s.dark.background)),
        `${p.id} dark fg/bg`,
      ).toBeGreaterThanOrEqual(7);
      // Texte secondaire (muted) sur surface-2 : AA (≥ 4.5:1).
      expect(
        contrastRatio(oklchToSrgb(s.light.muted), oklchToSrgb(s.light.surface2)),
        `${p.id} light muted`,
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrastRatio(oklchToSrgb(s.dark.muted), oklchToSrgb(s.dark.surface2)),
        `${p.id} dark muted`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
});

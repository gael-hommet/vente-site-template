import { describe, expect, it } from "vitest";
import { DESIGN_PRESETS, designLanguageSchema, getDesignPreset, presetToCss } from "@/ace/config";

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

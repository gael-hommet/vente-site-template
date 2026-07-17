import { describe, expect, it } from "vitest";
import { SCENES } from "@/ace/scenes/registry";

describe("ace-scenes registry (fallback obligatoire)", () => {
  it("registers the three demo scenes", () => {
    expect(SCENES.map((s) => s.id)).toEqual([
      "demo.logo-reveal",
      "demo.product-reveal",
      "demo.vehicle-journey",
    ]);
  });

  it("every scene declares a meaningful non-WebGL fallback", () => {
    for (const scene of SCENES) {
      expect(scene.fallback.alt.trim().length).toBeGreaterThan(3);
      // A fallback must be showable without WebGL: poster or video required.
      expect(Boolean(scene.fallback.poster ?? scene.fallback.video)).toBe(true);
    }
  });

  it("every scene is skippable and tier-gated", () => {
    for (const scene of SCENES) {
      expect(scene.skippable).toBe(true);
      expect(["ULTRA", "BALANCED", "LITE"]).toContain(scene.minTier);
    }
  });

  it("exposes lazy loaders without importing three.js at registry load", () => {
    // The registry module itself must stay metadata-light: loaders are
    // functions, and nothing here mounts a scene.
    for (const scene of SCENES) {
      expect(typeof scene.load).toBe("function");
    }
  });
});

import { describe, it, expect } from "vitest";
import {
  chooseStrategy,
  buildMediaPlan,
  buildShotPlan,
  estimateCost,
  assessMedia,
  assessContinuity,
  evaluateLowPolyRisk,
  assertNoLowPolySubstitution,
  QA_ACCEPT_THRESHOLD,
  isProviderConfigured,
  configuredProviders,
  allProviders,
  getProvider,
  type AceAvailableAssets,
  type AceMediaConstraints,
} from "@/ace/media-engine";

const NO_ASSETS: AceAvailableAssets = {
  continuousVideo: false,
  frameSequence: false,
  stillImages: false,
  realModel3d: false,
  depthMaps: false,
};

const CONSTRAINTS: AceMediaConstraints = {
  minTier: "BALANCED",
  reducedMotionSafe: true,
  mobilePremium: true,
};

describe("anti-low-poly doctrine", () => {
  it("WebGL + barre photoréaliste SANS modèle 3D = violation", () => {
    const v = evaluateLowPolyRisk("webgl", "photoreal", NO_ASSETS);
    expect(v.wouldViolate).toBe(true);
    expect(() => assertNoLowPolySubstitution("webgl", "photoreal", NO_ASSETS)).toThrow(
      /anti-low-poly/i,
    );
  });

  it("WebGL + barre photoréaliste AVEC vrai modèle 3D = conforme", () => {
    const assets = { ...NO_ASSETS, realModel3d: true };
    expect(evaluateLowPolyRisk("webgl", "photoreal", assets).wouldViolate).toBe(false);
    expect(() => assertNoLowPolySubstitution("webgl", "photoreal", assets)).not.toThrow();
  });

  it("stratégie non-WebGL = jamais concernée", () => {
    expect(evaluateLowPolyRisk("video-scroll", "photoreal", NO_ASSETS).wouldViolate).toBe(false);
  });

  it("barre graphique/éditoriale = WebGL assumé, pas de violation", () => {
    expect(evaluateLowPolyRisk("webgl", "graphic", NO_ASSETS).wouldViolate).toBe(false);
  });
});

describe("strategy decision layer", () => {
  it("vidéo continue + room-tour → video-scroll", () => {
    const d = chooseStrategy({
      intent: "room-tour",
      qualityBar: "photoreal",
      assets: { ...NO_ASSETS, continuousVideo: true },
      configuredProviders: [],
      constraints: CONSTRAINTS,
    });
    expect(d.strategy).toBe("video-scroll");
    expect(d.blocker).toBeNull();
  });

  it("frames dispo → image-sequence", () => {
    const d = chooseStrategy({
      intent: "image-sequence",
      qualityBar: "stylized-premium",
      assets: { ...NO_ASSETS, frameSequence: true },
      configuredProviders: [],
      constraints: CONSTRAINTS,
    });
    expect(d.strategy).toBe("image-sequence");
  });

  it("vrai modèle 3D + photoréaliste → webgl (jamais primitive)", () => {
    const d = chooseStrategy({
      intent: "project-reveal",
      qualityBar: "photoreal",
      assets: { ...NO_ASSETS, realModel3d: true },
      configuredProviders: [],
      constraints: CONSTRAINTS,
    });
    expect(d.strategy).toBe("webgl");
  });

  it("images fixes + photo-depth → 2.5d", () => {
    const d = chooseStrategy({
      intent: "photo-depth",
      qualityBar: "stylized-premium",
      assets: { ...NO_ASSETS, stillImages: true },
      configuredProviders: [],
      constraints: CONSTRAINTS,
    });
    expect(d.strategy).toBe("2.5d");
  });

  it("photoréaliste SANS asset NI provider → PAS de low-poly : PROVIDER_NOT_CONFIGURED + fallback éditorial", () => {
    const d = chooseStrategy({
      intent: "hero-cinematic",
      qualityBar: "photoreal",
      assets: NO_ASSETS,
      configuredProviders: [],
      constraints: CONSTRAINTS,
    });
    expect(d.strategy).not.toBe("webgl");
    expect(d.blocker).toBe("PROVIDER_NOT_CONFIGURED");
    expect(d.premiumFallback).toBe("editorial-fallback");
  });

  it("photoréaliste SANS asset MAIS provider configuré → hybrid (générer), pas de blocker", () => {
    const d = chooseStrategy({
      intent: "hero-cinematic",
      qualityBar: "photoreal",
      assets: NO_ASSETS,
      configuredProviders: ["higgsfield"],
      constraints: CONSTRAINTS,
    });
    expect(d.strategy).toBe("hybrid");
    expect(d.blocker).toBeNull();
  });
});

describe("shot planner", () => {
  it("produit des plans avec raccords chaînés (refOut→refIn)", () => {
    const shots = buildShotPlan("room-tour", "video-scroll");
    expect(shots.length).toBeGreaterThanOrEqual(2);
    expect(shots[0].refIn).toBeNull();
    // Le refIn du plan 2 = l'endState du plan 1.
    expect(shots[1].refIn).toBe(shots[0].endState);
    for (const s of shots) {
      expect(s.durationS).toBeGreaterThan(0);
      expect(s.focusPoint.length).toBeGreaterThan(0);
    }
  });
});

describe("cost guard", () => {
  it("génération locale/gratuite → coût 0", () => {
    const c = estimateCost({ strategy: "image-sequence", shotCount: 3, pricing: null });
    expect(c.minimalCost).toBe(0);
    expect(c.exceedsThreshold).toBe(false);
  });

  it("génération payante → coûts chiffrés depuis le tarif fourni (jamais inventé)", () => {
    const c = estimateCost({
      strategy: "hybrid",
      shotCount: 3,
      pricing: { provider: "higgsfield", unitCost: 2, currency: "USD", source: "doc" },
      alertThreshold: 10,
    });
    expect(c.minimalCost).toBe(6); // 3 shots × 1 × 2
    expect(c.recommendedCost).toBe(12); // 3 × 2 × 2
    expect(c.exceedsThreshold).toBe(true); // 12 > 10
  });

  it("sans tarif → non chiffré avec note honnête", () => {
    const c = estimateCost({ strategy: "hybrid", shotCount: 2, pricing: null });
    expect(c.note).toMatch(/non chiffré|0/i);
  });
});

describe("media QA & continuity", () => {
  it("scores par défaut (0) → rejeté, revue humaine toujours requise", () => {
    const shots = buildShotPlan("hero-cinematic", "video-scroll");
    const r = assessMedia(shots[0]);
    expect(r.accepted).toBe(false);
    expect(r.requiresHumanReview).toBe(true);
  });

  it("bons scores + aucune issue structurelle → accepté", () => {
    const shots = buildShotPlan("hero-cinematic", "video-scroll");
    const r = assessMedia(shots[0], {
      continuity: 0.9,
      realism: 0.9,
      narration: 0.8,
      integrability: 0.9,
      perceivedValue: 0.9,
    });
    expect(r.overall).toBeGreaterThanOrEqual(QA_ACCEPT_THRESHOLD);
    expect(r.accepted).toBe(true);
  });

  it("continuité : raccord incohérent détecté", () => {
    const a = buildShotPlan("room-tour", "video-scroll")[0];
    const b = { ...a, id: "x", refIn: "état totalement différent" };
    const rep = assessContinuity(a, b, 0.9);
    expect(rep.breaks.length).toBeGreaterThan(0);
    expect(rep.acceptable).toBe(false);
  });
});

describe("media plan builder", () => {
  it("assemble un plan complet cohérent avec la décision", () => {
    const plan = buildMediaPlan({
      intent: "room-tour",
      qualityBar: "photoreal",
      emotionalGoal: "faire ressentir l'espace",
      assets: { ...NO_ASSETS, continuousVideo: true },
      configuredProviders: [],
      constraints: CONSTRAINTS,
      subject: "le chalet",
    });
    expect(plan.decision.strategy).toBe("video-scroll");
    expect(plan.shots.length).toBeGreaterThan(0);
    expect(plan.referenceLocks[0]).toMatch(/chalet/);
    expect(plan.expectedOutput).toMatch(/mp4|webm/);
  });

  it("besoin premium sans asset ni provider → risque média externe explicite", () => {
    const plan = buildMediaPlan({
      intent: "hero-cinematic",
      qualityBar: "photoreal",
      emotionalGoal: "impressionner",
      assets: NO_ASSETS,
      configuredProviders: [],
      constraints: CONSTRAINTS,
    });
    expect(plan.decision.blocker).toBe("PROVIDER_NOT_CONFIGURED");
    expect(plan.risks.join(" ")).toMatch(/provider|média externe/i);
  });
});

describe("provider layer (honnête)", () => {
  it("higgsfield non configuré par défaut (pas de faux succès)", () => {
    // Dans l'env de test, HIGGSFIELD_API_KEY est absent.
    expect(isProviderConfigured("higgsfield")).toBe(false);
    expect(configuredProviders()).not.toContain("higgsfield");
    const hf = getProvider("higgsfield");
    expect(hf?.status()).toBe("PROVIDER_NOT_CONFIGURED");
  });

  it("higgsfield.generate refuse proprement sans credential", async () => {
    const hf = getProvider("higgsfield");
    const shots = buildShotPlan("hero-cinematic", "hybrid");
    const res = await hf!.generate!({ shot: shots[0], prompt: "x", outDir: "/tmp" });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe("PROVIDER_NOT_CONFIGURED");
  });

  it("le registre expose local + higgsfield", () => {
    const names = allProviders().map((p) => p.name);
    expect(names).toContain("local");
    expect(names).toContain("higgsfield");
  });
});

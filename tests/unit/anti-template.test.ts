import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  proximity,
  comparePair,
  dimensionSimilarity,
  DIMENSIONS,
  MAX_PROXIMITY,
} from "../../scripts/ace/compare-creative-fingerprints.mjs";

/**
 * Tests du détecteur de proximité anti-template. Couvre : empreintes
 * identiques, légèrement différentes, radicalement différentes, données
 * incomplètes, et les deux côtés du seuil. Vérifie aussi que les trois
 * empreintes réelles (temoin-a/editorial/immersive) sont bien distinctes.
 */

const FP_DIR = path.resolve(__dirname, "../../docs/anti-template");
const load = (name: string) =>
  JSON.parse(readFileSync(path.join(FP_DIR, `${name}-fingerprint.json`), "utf8"));

const base = {
  designLanguage: "editorial-light",
  recipes: {
    hero: "typographic",
    navigation: "editorial-folio",
    projects: "editorial-index",
    storytelling: "alternating-narrative",
    conversion: "minimal-contact",
    layout: "editorial-layout",
  },
  motionProfile: "subtle",
  sceneProfile: "no-scene",
  webgl: false,
  density: "spacious",
  dominantSurface: "claire papier chaud",
  sectionOrder: ["hero", "storytelling", "collection", "conversion"],
  heroDom: "titre géant sans média deux CTA",
  navigationDom: "folio liens numérotés",
  collectionDom: "sommaire indexé lignes",
  conversionDom: "bloc centré sobre",
  mobileBehavior: "nav repliée menu texte",
  mediaTreatment: "aucun média typographie visuel",
};

describe("compare-creative-fingerprints", () => {
  it("deux empreintes identiques → proximité 1 (au-dessus du seuil)", () => {
    const { score } = proximity(base, structuredClone(base));
    expect(score).toBe(1);
    expect(score).toBeGreaterThan(MAX_PROXIMITY);
  });

  it("empreintes légèrement différentes → proximité élevée mais < 1", () => {
    const slight = structuredClone(base);
    slight.recipes.conversion = "premium-inquiry";
    slight.conversionDom = "bande brand carte action premium";
    const { score } = proximity(base, slight);
    expect(score).toBeGreaterThan(0.7);
    expect(score).toBeLessThan(1);
  });

  it("empreintes radicalement différentes → proximité sous le seuil", () => {
    const opposite = {
      designLanguage: "precision-dark",
      recipes: {
        hero: "media-first",
        navigation: "immersive-overlay",
        projects: "horizontal-chapters",
        storytelling: "immersive-scroll",
        conversion: "premium-inquiry",
        layout: "immersive-layout",
      },
      motionProfile: "cinematic",
      sceneProfile: "immersive-environment",
      webgl: true,
      density: "compact",
      dominantSurface: "sombre noir cyan",
      sectionOrder: ["hero", "scene", "storytelling", "collection", "conversion"],
      heroDom: "média plein cadre voile titre bas scène webgl",
      navigationDom: "menu overlay plein écran dialog géants escape",
      collectionDom: "carrousel horizontal scroll-snap chapitres",
      conversionDom: "bande brand carte action premium",
      mobileBehavior: "overlay plein écran sticky cta actif",
      mediaTreatment: "média plein cadre scène 3d fallback poster",
    };
    const { score } = proximity(base, opposite);
    expect(score).toBeLessThan(MAX_PROXIMITY);
  });

  it("gère des données incomplètes sans planter (dimensions absentes)", () => {
    const partial = { designLanguage: "onyx", recipes: { hero: "split-narrative" } };
    const res = proximity(base, partial) as { score: number; perDimension: Record<string, number> };
    expect(res.score).toBeGreaterThanOrEqual(0);
    expect(res.score).toBeLessThanOrEqual(1);
    // Une dimension catégorielle absente d'un côté ⇒ différente (0).
    expect(res.perDimension.layout).toBe(0);
  });

  it("dimensionSimilarity : catégorielle égale = 1, différente = 0", () => {
    const dl = DIMENSIONS.find((d) => d.key === "designLanguage")!;
    expect(dimensionSimilarity(dl, { designLanguage: "x" }, { designLanguage: "x" })).toBe(1);
    expect(dimensionSimilarity(dl, { designLanguage: "x" }, { designLanguage: "y" })).toBe(0);
  });

  it("comparePair : verdict 'trop proche' au-dessus du seuil, 'distinct' en-dessous", () => {
    const same = comparePair("a", base, "b", structuredClone(base));
    expect(same.tooClose).toBe(true);
    expect(same.verdict).toBe("PROXIMITÉ EXCESSIVE");

    const diff = comparePair("a", base, "b", {
      ...base,
      designLanguage: "precision-dark",
      recipes: { ...base.recipes, hero: "media-first", navigation: "immersive-overlay" },
      webgl: true,
      heroDom: "média plein cadre scène",
      navigationDom: "overlay plein écran dialog",
    });
    // Pas forcément sous le seuil (peu de dims changées), mais pas identique.
    expect(diff.proximity).toBeLessThan(same.proximity);
  });

  it("les trois empreintes RÉELLES sont deux à deux distinctes (< seuil)", () => {
    const temoinA = load("temoin-a");
    const editorial = load("editorial");
    const immersive = load("immersive");
    expect(comparePair("i", temoinA, "e", editorial).tooClose).toBe(false);
    expect(comparePair("i", temoinA, "m", immersive).tooClose).toBe(false);
    expect(comparePair("e", editorial, "m", immersive).tooClose).toBe(false);
  });
});

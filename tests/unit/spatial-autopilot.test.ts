import { describe, it, expect } from "vitest";
import {
  decideSpatialStrategy,
  explainSpatialDecision,
  spatialCandidates,
  depthMapFor,
} from "@/ace/autopilot/spatial-decision";
import type { AssetInventory, AssetRecord } from "@/ace/media-engine/asset-source";
import { createMission, userReport } from "@/ace/autopilot";
import { detectIntent } from "@/ace/autopilot/intent";

/**
 * ACE 0.3 — l'Autopilot choisit SEUL la stratégie spatiale.
 *
 * L'utilisateur écrit une phrase ; il ne répond à aucun questionnaire technique.
 * Ces tests vérifient la règle du mandat : une photo → scène en profondeur ;
 * plusieurs photos espacées → voyage hybride ; un GLB → vraie 3D ; rien
 * d'exploitable → on ne promet rien.
 */

const asset = (over: Partial<AssetRecord> = {}): AssetRecord => ({
  path: "/assets/client/salle.jpg",
  source: "OFFICIAL_WEBSITE",
  sourceRef: "https://exemple.test/salle.jpg",
  nature: "REAL",
  role: "gallery",
  kind: "image",
  alt: "Salle principale",
  rights: "CONFIRMED",
  ...over,
});

const inventory = (
  assets: AssetRecord[],
  usage: AssetInventory["usage"] = "PRIVATE_DEMO",
): AssetInventory => ({
  usage,
  assets,
  missing: [],
});

describe("Autopilot — stratégie spatiale", () => {
  it("une photo + sa profondeur → scène en profondeur", () => {
    const inv = inventory([
      asset({ path: "/a/salle.jpg" }),
      asset({ path: "/a/salle.depth.png", role: "gallery" }),
    ]);
    const d = decideSpatialStrategy(inv);
    // La depth map n'est pas une scène : elle accompagne l'image.
    expect(d.mode).toBe("depth-scene");
    expect(explainSpatialDecision(d)).toContain("La photo devient un espace");
  });

  it("plusieurs photos avec profondeur → voyage hybride", () => {
    const inv = inventory(
      ["salle", "bar", "terrasse", "cave"].flatMap((n) => [
        asset({ path: `/a/${n}.jpg` }),
        asset({ path: `/a/${n}.depth.png` }),
      ]),
    );
    const d = decideSpatialStrategy(inv);
    expect(d.mode).toBe("hybrid-spatial");
    expect(d.images).toHaveLength(4);
    expect(d.depthMaps.filter(Boolean)).toHaveLength(4);
  });

  it("un vrai modèle 3D l'emporte sur tout le reste", () => {
    const inv = inventory([
      asset({ path: "/a/salle.jpg" }),
      asset({ path: "/a/lieu.glb", kind: "image" }),
    ]);
    expect(decideSpatialStrategy(inv).mode).toBe("real-3d");
  });

  it("sans carte de profondeur, ACE REFUSE d'inventer un espace", () => {
    const inv = inventory([asset({ path: "/a/salle.jpg" }), asset({ path: "/a/bar.jpg" })]);
    const d = decideSpatialStrategy(inv);
    // Le mandat est explicite : jamais de fausse profondeur, jamais de diaporama.
    expect(d.mode).not.toBe("hybrid-spatial");
    expect(d.missing.join(" ")).toContain("ACE ne l'invente pas");
  });

  it("écarte les visuels conceptuels et les logos d'une « visite »", () => {
    const inv = inventory([
      asset({ path: "/a/logo.png", role: "logo" }),
      asset({ path: "/a/ambiance.jpg", nature: "CONCEPTUAL" }),
      asset({ path: "/a/salle.jpg" }),
    ]);
    const kept = spatialCandidates(inv);
    expect(kept.map((a) => a.path)).toEqual(["/a/salle.jpg"]);
  });

  it("en PRODUCTION, une image aux droits non confirmés est écartée", () => {
    const assets = [
      asset({ path: "/a/salle.jpg", rights: "OFFICIAL_PUBLIC_UNCONFIRMED" }),
      asset({ path: "/a/salle.depth.png", rights: "OFFICIAL_PUBLIC_UNCONFIRMED" }),
    ];
    // Maquette privée : utilisable, à confirmer avant publication.
    expect(spatialCandidates(inventory(assets, "PRIVATE_DEMO"))).toHaveLength(1);
    // Production : non confirmé = pas publié.
    expect(spatialCandidates(inventory(assets, "PRODUCTION"))).toHaveLength(0);
  });

  it("sans aucune photo réelle, aucune expérience n'est promise", () => {
    const d = decideSpatialStrategy(inventory([asset({ nature: "CONCEPTUAL" })]));
    expect(d.missing.join(" ")).toContain("aucune photo réelle");
    expect(explainSpatialDecision(d)).toContain("éditoriale");
  });

  it("associe chaque image à sa carte de profondeur, quel que soit le suffixe", () => {
    const inv = inventory([
      asset({ path: "/a/salle.jpg" }),
      asset({ path: "/a/salle.depth.png" }),
      asset({ path: "/a/bar.jpg" }),
      asset({ path: "/a/bar-depth.png" }),
      asset({ path: "/a/seul.jpg" }),
    ]);
    expect(depthMapFor(asset({ path: "/a/salle.jpg" }), inv)).toBe("/a/salle.depth.png");
    expect(depthMapFor(asset({ path: "/a/bar.jpg" }), inv)).toBe("/a/bar-depth.png");
    expect(depthMapFor(asset({ path: "/a/seul.jpg" }), inv)).toBeNull();
  });

  it("la décision est EXPOSÉE par le barrel Autopilot (intégration, pas module orphelin)", async () => {
    const mod = await import("@/ace/autopilot");
    expect(typeof mod.decideSpatialStrategy).toBe("function");
    expect(typeof mod.explainSpatialDecision).toBe("function");
  });

  it("une mission porte la décision spatiale et la formule sans jargon", () => {
    const brief = "Transforme ces quatre images en visite immersive.";
    const mission = createMission({
      id: "m1",
      brief,
      intent: detectIntent(brief),
      slug: "visite",
      now: "2026-08-11T00:00:00.000Z",
    });
    // Le champ existe dès la création : la reprise après coupure le conserve.
    expect(mission.spatial).toBeNull();

    const inv = inventory(
      ["salle", "bar", "terrasse", "cave"].flatMap((n) => [
        asset({ path: `/a/${n}.jpg` }),
        asset({ path: `/a/${n}.depth.png` }),
      ]),
    );
    const d = decideSpatialStrategy(inv);
    const withSpatial = {
      ...mission,
      state: "COMPLETE" as const,
      targetDir: "/tmp/visite",
      spatial: {
        mode: d.mode ?? ("none" as const),
        explanation: explainSpatialDecision(d),
        images: d.images,
        missing: d.missing,
      },
    };

    // Le rapport utilisateur parle du résultat, jamais de WebGL ni de depth map.
    const report = userReport(withSpatial);
    expect(report).toContain("espaces traversés par une caméra");
    expect(report).not.toMatch(/WebGL|depth map|shader|hybrid-spatial/i);
  });
});

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  resolveTimeline,
  validateTimeline,
  transitionWindow,
  distributeScenes,
  activeChapter,
  cameraAt,
  cameraPathFor,
  distance,
  isStaticPath,
  directionChangeDegrees,
  easeInOutCubic,
  vec3,
  CAMERA_MOVES,
  chooseSpatialMode,
  requiresWebGL,
  assessSpatialQuality,
  confirmVisualReview,
  MAX_SPATIAL_SCENES,
  type SpatialManifest,
} from "@/ace/spatial-cinema";
import { sceneScale, worstCaseFraming } from "@/ace/spatial-cinema/layout";
import { SPATIAL_FIXTURE } from "@/ace/spatial-cinema/fixture";
import {
  occlusionCurve,
  outgoingOpacity,
  MIN_CROSSOVER_MASK,
  SWAP_START,
  SWAP_END,
  incomingOpacity,
  transitionDarken,
  sceneOriginsOf,
} from "@/ace/spatial-cinema/SpatialCinema";

/**
 * ACE SPATIAL CINEMA — preuves.
 *
 * Le test central est ANTI-SLIDESHOW : il doit ÉCHOUER si l'implémentation
 * redevient « image = round(progress × n) » ou un simple fondu croisé.
 */

const ROOT = path.resolve(__dirname, "../..");

describe("ANTI-SLIDESHOW — la caméra se déplace réellement", () => {
  it("la position caméra change continûment DANS une scène", () => {
    const scene = SPATIAL_FIXTURE.scenes[0];
    if (!scene) throw new Error("fixture vide");
    const samples = [0, 0.25, 0.5, 0.75, 1].map((p) => cameraAt(scene.camera, p));

    // Chaque échantillon est distinct du précédent : aucun palier figé.
    for (let i = 1; i < samples.length; i += 1) {
      const d = distance(
        (samples[i] as { position: { x: number; y: number; z: number } }).position,
        (samples[i - 1] as { position: { x: number; y: number; z: number } }).position,
      );
      expect(d, `échantillon ${String(i)} immobile`).toBeGreaterThan(0.01);
    }
    // Le déplacement total est significatif (pas un frémissement).
    const total = distance(samples[0]!.position, samples[samples.length - 1]!.position);
    expect(total).toBeGreaterThan(0.3);
  });

  it("le déplacement est CONTINU : aucun saut brutal entre deux pas de scroll", () => {
    const scene = SPATIAL_FIXTURE.scenes[2];
    if (!scene) throw new Error("fixture");
    let previous = cameraAt(scene.camera, 0).position;
    let maxStep = 0;
    for (let p = 0.02; p <= 1; p += 0.02) {
      const cur = cameraAt(scene.camera, p).position;
      maxStep = Math.max(maxStep, distance(previous, cur));
      previous = cur;
    }
    // Un diaporama produirait un saut énorme au changement d'image.
    expect(maxStep).toBeLessThan(0.08);
  });

  it("le parcours est parfaitement RÉVERSIBLE (aucune mémoire, aucun autoplay)", () => {
    const scene = SPATIAL_FIXTURE.scenes[1];
    if (!scene) throw new Error("fixture");
    const forward = [0, 0.3, 0.6, 0.9].map((p) => cameraAt(scene.camera, p));
    const backward = [0.9, 0.6, 0.3, 0].map((p) => cameraAt(scene.camera, p)).reverse();
    forward.forEach((f, i) => {
      expect(distance(f.position, (backward[i] as typeof f).position)).toBeLessThan(1e-9);
    });
  });

  it("la profondeur est réelle : aucune scène plate", () => {
    for (const scene of SPATIAL_FIXTURE.scenes) {
      expect(scene.depth.strength, `${scene.id} plat`).toBeGreaterThan(0.05);
      expect(scene.depthMap, `${scene.id} sans depth map`).toBeTruthy();
      // near ≠ far, sinon le déplacement serait uniforme (donc plat).
      expect(scene.depth.near).not.toBe(scene.depth.far);
    }
  });

  it("le shader déplace VRAIMENT les sommets en fonction de la depth map", () => {
    const src = readFileSync(path.join(ROOT, "src/ace/spatial-cinema/DepthMesh.tsx"), "utf8");
    // Le vertex shader échantillonne la profondeur et déplace la position.
    expect(src).toMatch(/texture2D\(\s*uDepth/);
    expect(src).toMatch(/position \+ normal \* mapped \* uStrength/);
    // Un maillage subdivisé est indispensable : un plan 1×1 ne se déforme pas.
    expect(src).toMatch(/planeGeometry args=\{\[scale\[0\], scale\[1\], segments, segments\]\}/);
  });

  it("une transition n'est JAMAIS un simple fondu : le mouvement précède le blend", () => {
    // Première moitié du raccord : la scène sortante reste pleinement opaque
    // (c'est l'occlusion spatiale qui masque, pas l'opacité).
    expect(outgoingOpacity(0)).toBe(1);
    expect(outgoingOpacity(0.25)).toBe(1);
    expect(outgoingOpacity(SWAP_START)).toBe(1);
    // La scène entrante n'apparaît pas avant que l'écran soit masqué.
    expect(incomingOpacity(0)).toBe(0);
    expect(incomingOpacity(SWAP_START)).toBe(0);
    // La bascule est confinée au pic d'occlusion, pas étalée sur le raccord.
    expect(SWAP_END - SWAP_START).toBeLessThanOrEqual(0.15);
    // Les deux ne sont jamais simultanément très visibles.
    for (let t = 0; t <= 1; t += 0.05) {
      const both = Math.min(outgoingOpacity(t), incomingOpacity(t));
      expect(both, `t=${t.toFixed(2)} : les deux scènes visibles ensemble`).toBeLessThan(0.51);
    }
    // L'occlusion culmine au milieu du raccord : c'est elle qui masque.
    expect(occlusionCurve(0.5)).toBeGreaterThan(0.99);
    expect(occlusionCurve(0)).toBeLessThan(0.01);
  });

  it("la bascule entre deux scènes se produit dans l'obscurité, jamais en fondu visible", () => {
    // Au croisement (t = 0.5) les deux opacités valent 0.5 : c'est le seul
    // instant où un fondu pourrait se voir. L'écran doit alors être masqué.
    for (const type of [
      "OCCLUSION",
      "PUSH_THROUGH",
      "DARK_FRAME",
      "GLASS_PASS",
      "DEPTH_WARP",
      "EDGE_WIPE_SPATIAL",
    ]) {
      // Balayage fin : PARTOUT où les deux scènes coexistent, l'écran est masqué.
      for (let t = 0; t <= 1.0001; t += 0.01) {
        const bothVisible = Math.min(outgoingOpacity(t), incomingOpacity(t));
        if (bothVisible > 0.02) {
          expect(
            transitionDarken(type, t),
            `${type} à t=${t.toFixed(2)} : bascule visible en pleine lumière`,
          ).toBeGreaterThanOrEqual(MIN_CROSSOVER_MASK);
        }
      }
    }
  });

  it("les scènes occupent des positions distinctes dans l'espace", () => {
    // Un diaporama superposerait tout au même endroit.
    const origins = sceneOriginsOf(SPATIAL_FIXTURE);
    for (let i = 1; i < origins.length; i += 1) {
      expect(origins[i]?.[2]).not.toBe(origins[i - 1]?.[2]);
    }
  });

  it("la caméra passe d'une scène à l'autre SANS saut de position", () => {
    // Le raccord doit être un mouvement continu : la position de fin d'une
    // scène est exactement la position de départ de la suivante. Sinon le
    // spectateur voit une coupe — et la scène d'arrivée apparaît « au loin ».
    const origins = sceneOriginsOf(SPATIAL_FIXTURE);
    for (let i = 1; i < SPATIAL_FIXTURE.scenes.length; i += 1) {
      const prev = SPATIAL_FIXTURE.scenes[i - 1]!;
      const cur = SPATIAL_FIXTURE.scenes[i]!;
      const endOfPrev = origins[i - 1]![2] + cameraAt(prev.camera, 1).position.z;
      const startOfCur = origins[i]![2] + cameraAt(cur.camera, 0).position.z;
      expect(Math.abs(endOfPrev - startOfCur)).toBeLessThan(1e-9);
    }
  });

  it("chaque plan couvre le cadre, même en écran très large ou très haut", () => {
    // Un plan trop petit laisse apparaître le fond : c'est un motif de REJET.
    for (const scene of SPATIAL_FIXTURE.scenes) {
      const { distance, fov } = worstCaseFraming(scene);
      for (const aspect of [0.46, 1, 1.6, 2.4]) {
        const [w, h] = sceneScale(scene, aspect);
        // Hauteur/largeur réellement visibles à la distance la plus défavorable.
        const visibleH = 2 * distance * Math.tan((fov * Math.PI) / 360);
        expect(h).toBeGreaterThan(visibleH);
        expect(w).toBeGreaterThan(visibleH * aspect);
      }
    }
  });

  it("REJETTE une implémentation dégradée en diaporama", () => {
    // Manifeste « diaporama » : caméra immobile, profondeur nulle, coupe franche.
    const slideshow: SpatialManifest = {
      mode: "hybrid-spatial",
      poster: "/p.jpg",
      alt: "x",
      scenes: [
        {
          id: "a",
          image: "/a.jpg",
          depthMap: "/d.png",
          start: 0,
          end: 0.5,
          camera: {
            positionFrom: vec3(0, 0, 2),
            positionTo: vec3(0, 0, 2),
            targetFrom: vec3(0, 0, 0),
            targetTo: vec3(0, 0, 0),
            fovFrom: 50,
            fovTo: 50,
          },
          depth: { strength: 0, near: 1, far: 0 },
          transitionOut: { type: "OCCLUSION", duration: 0.001 },
          alt: "a",
        },
        {
          id: "b",
          image: "/b.jpg",
          depthMap: "/d.png",
          start: 0.5,
          end: 1,
          camera: {
            positionFrom: vec3(0, 0, 2),
            positionTo: vec3(0, 0, 2),
            targetFrom: vec3(0, 0, 0),
            targetTo: vec3(0, 0, 0),
            fovFrom: 50,
            fovTo: 50,
          },
          depth: { strength: 0, near: 1, far: 0 },
          alt: "b",
        },
      ],
    };
    const report = assessSpatialQuality(slideshow);
    expect(report.verdict).toBe("REJECT");
    const violations = report.issues.map((i) => i.violation);
    expect(violations).toContain("NO_CAMERA_MOVEMENT");
    expect(violations).toContain("FLAT_TEXTURE");
    expect(violations).toContain("HARD_CUT");
  });
});

describe("Timeline — un seul voyage continu", () => {
  it("la fixture est cohérente (aucun trou, bornes correctes)", () => {
    expect(validateTimeline(SPATIAL_FIXTURE)).toEqual([]);
  });

  it("mappe la progression globale vers scène + progression locale", () => {
    const start = resolveTimeline(SPATIAL_FIXTURE, 0);
    expect(start.sceneIndex).toBe(0);
    expect(start.localProgress).toBeCloseTo(0, 5);

    const end = resolveTimeline(SPATIAL_FIXTURE, 1);
    expect(end.sceneIndex).toBe(SPATIAL_FIXTURE.scenes.length - 1);
    expect(end.localProgress).toBeCloseTo(1, 5);
  });

  it("la progression locale est monotone dans chaque scène", () => {
    let previous = -1;
    for (let p = 0; p <= 0.27; p += 0.01) {
      const s = resolveTimeline(SPATIAL_FIXTURE, p);
      expect(s.sceneIndex).toBe(0);
      expect(s.localProgress).toBeGreaterThanOrEqual(previous);
      previous = s.localProgress;
    }
  });

  it("détecte la fenêtre de transition et garde les DEUX scènes montées", () => {
    const scene = SPATIAL_FIXTURE.scenes[0];
    if (!scene) throw new Error("fixture");
    const win = transitionWindow(scene);
    expect(win).not.toBeNull();
    const mid = ((win as { start: number; end: number }).start + (win as { end: number }).end) / 2;
    const state = resolveTimeline(SPATIAL_FIXTURE, mid);
    expect(state.transition).not.toBeNull();
    expect(state.activeScenes).toHaveLength(2);
    // La scène sortante reste la scène principale : la caméra ne saute pas.
    expect(state.sceneIndex).toBe(0);
  });

  it("clampe hors bornes sans casser", () => {
    expect(resolveTimeline(SPATIAL_FIXTURE, -5).progress).toBe(0);
    expect(resolveTimeline(SPATIAL_FIXTURE, 9).progress).toBe(1);
  });

  it("distribue des scènes régulières et suit les chapitres", () => {
    const spans = distributeScenes(4);
    expect(spans).toHaveLength(4);
    expect(spans[0]?.start).toBe(0);
    expect(spans[3]?.end).toBe(1);
    expect(activeChapter(SPATIAL_FIXTURE, 0)).toBe(0);
    expect(activeChapter(SPATIAL_FIXTURE, 0.9)).toBe(3);
  });
});

describe("Caméra — primitives cinématiques", () => {
  it("toutes les primitives produisent un mouvement réel", () => {
    for (const move of CAMERA_MOVES) {
      const path = cameraPathFor(move);
      expect(isStaticPath(path), `${move} immobile`).toBe(false);
    }
  });

  it("l'adoucissement est symétrique et borné", () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 5);
  });

  it("la continuité de direction est mesurée entre scènes", () => {
    for (let i = 0; i < SPATIAL_FIXTURE.scenes.length - 1; i += 1) {
      const a = SPATIAL_FIXTURE.scenes[i];
      const b = SPATIAL_FIXTURE.scenes[i + 1];
      if (!a || !b) continue;
      // Aucun demi-tour au raccord.
      expect(directionChangeDegrees(a.camera, b.camera)).toBeLessThan(45);
    }
  });

  it("l'assombrissement de traversée dépend du type de transition", () => {
    expect(transitionDarken("DARK_FRAME", 0.5)).toBeGreaterThan(transitionDarken("OCCLUSION", 0.5));
    expect(transitionDarken("DARK_FRAME", 0)).toBeCloseTo(0, 3);
  });
});

describe("Stratégie — ce que le matériau réel permet", () => {
  it("un vrai modèle 3D gagne toujours", () => {
    const d = chooseSpatialMode({ imageCount: 4, depthMapCount: 4, hasRealModel3d: true });
    expect(d.mode).toBe("real-3d");
  });

  it("plusieurs images + profondeur → voyage hybride", () => {
    const d = chooseSpatialMode({ imageCount: 4, depthMapCount: 4, hasRealModel3d: false });
    expect(d.mode).toBe("hybrid-spatial");
    expect(d.sceneCount).toBe(4);
    expect(d.blocker).toBeNull();
  });

  it("une image + profondeur → scène depth, avec sa limite annoncée", () => {
    const d = chooseSpatialMode({ imageCount: 1, depthMapCount: 1, hasRealModel3d: false });
    expect(d.mode).toBe("depth-scene");
    expect(d.caveats.join(" ")).toMatch(/crédible/i);
  });

  it("images SANS profondeur → DEPTH_MAP_REQUIRED, jamais un plan plat", () => {
    const d = chooseSpatialMode({ imageCount: 3, depthMapCount: 0, hasRealModel3d: false });
    expect(d.blocker).toBe("DEPTH_MAP_REQUIRED");
    expect(d.mode).toBeNull();
    expect(d.rationale).toMatch(/diaporama/i);
  });

  it("aucune image → MEDIA_ASSET_REQUIRED (rien n'est fabriqué)", () => {
    const d = chooseSpatialMode({ imageCount: 0, depthMapCount: 0, hasRealModel3d: false });
    expect(d.blocker).toBe("MEDIA_ASSET_REQUIRED");
  });

  it("beaucoup de vues chevauchantes → candidat reconstruction, jamais promis", () => {
    const d = chooseSpatialMode({
      imageCount: 40,
      depthMapCount: 40,
      hasRealModel3d: false,
      overlappingViews: true,
    });
    expect(d.caveats.join(" ")).toMatch(/non réalisée par ACE 0\.3/i);
    expect(d.sceneCount).toBeLessThanOrEqual(MAX_SPATIAL_SCENES);
    expect(requiresWebGL(d.mode)).toBe(true);
  });
});

describe("Spatial quality gate", () => {
  it("la fixture ne présente aucun défaut MESURABLE, mais exige une revue visuelle", () => {
    const report = assessSpatialQuality(SPATIAL_FIXTURE);
    expect(report.issues).toEqual([]);
    expect(report.verdict).toBe("REVIEW_REQUIRED");
    expect(report.requiresVisualReview).toBe(true);
    expect(report.measured.length).toBeGreaterThan(0);
  });

  it("PASS n'est atteignable qu'après avoir REGARDÉ le rendu", () => {
    const report = assessSpatialQuality(SPATIAL_FIXTURE);
    const confirmed = confirmVisualReview(report, { looksSpatial: true, notes: ["captures vues"] });
    expect(confirmed.verdict).toBe("PASS");
    expect(confirmed.requiresVisualReview).toBe(false);

    const refused = confirmVisualReview(report, { looksSpatial: false });
    expect(refused.verdict).toBe("REVIEW_REQUIRED");
  });

  it("refuse un déplacement excessif (le maillage se trouerait)", () => {
    const wild: SpatialManifest = {
      ...SPATIAL_FIXTURE,
      scenes: [
        {
          ...(SPATIAL_FIXTURE.scenes[0] as (typeof SPATIAL_FIXTURE.scenes)[number]),
          start: 0,
          end: 1,
          transitionOut: undefined,
          camera: {
            positionFrom: vec3(0, 0, 3),
            positionTo: vec3(0, 0, -5),
            targetFrom: vec3(0, 0, 0),
            targetTo: vec3(0, 0, 0),
            fovFrom: 50,
            fovTo: 50,
          },
        },
      ],
    };
    const report = assessSpatialQuality(wild);
    expect(report.issues.map((i) => i.violation)).toContain("EXCESSIVE_PARALLAX");
  });
});

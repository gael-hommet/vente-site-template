import type { SpatialManifest } from "./types";
import { cameraPathFor, vec3 } from "./camera-path";

/**
 * ACE SPATIAL CINEMA — manifeste de démonstration (interne au moteur).
 *
 * Quatre « scènes » synthétiques fabriquées localement (mires + cartes de
 * profondeur structurées, générées par ffmpeg — coût 0 €). Elles ne prétendent
 * pas être de vraies photos : elles servent à PROUVER que le maillage réagit
 * réellement à la profondeur et que la caméra se déplace.
 *
 * Le voyage suit une progression volontairement architecturale :
 * approche → traversée d'une ouverture → intérieur → ouverture vers l'extérieur.
 */

const BASE = "/ace-lab/spatial";

export const SPATIAL_FIXTURE: SpatialManifest = {
  mode: "hybrid-spatial",
  poster: `${BASE}/scene-1.jpg`,
  alt: "Démonstration spatiale ACE : quatre scènes en profondeur réelle, parcourues par une caméra.",
  length: 8,
  scenes: [
    {
      id: "approche",
      image: `${BASE}/scene-1.jpg`,
      depthMap: `${BASE}/depth-1.png`,
      start: 0,
      end: 0.28,
      // La caméra avance : le premier plan défile plus vite que le fond.
      camera: cameraPathFor("dolly-in", vec3(0, 0, 2.8)),
      depth: { strength: 1.15, near: 1, far: 0 },
      transitionOut: {
        type: "OCCLUSION",
        duration: 0.05,
        occlusionAnchor: { x: 0.5, y: 0.6 },
        direction: "forward",
        anchors: [
          { sceneA: { x: 0.5, y: 0.55 }, sceneB: { x: 0.5, y: 0.5 }, importance: 1, label: "ouverture" },
        ],
      },
      alt: "Vue d'approche : premier plan proche, fond lointain.",
    },
    {
      id: "seuil",
      image: `${BASE}/scene-2.jpg`,
      depthMap: `${BASE}/depth-2.png`,
      start: 0.28,
      end: 0.53,
      // Traversée : la caméra passe littéralement au travers du plan.
      camera: cameraPathFor("push-through", vec3(0, 0, 2.6)),
      depth: { strength: 0.95, near: 1, far: 0 },
      transitionOut: {
        type: "PUSH_THROUGH",
        duration: 0.06,
        occlusionAnchor: { x: 0.5, y: 0.5 },
        direction: "forward",
        anchors: [
          { sceneA: { x: 0.5, y: 0.5 }, sceneB: { x: 0.5, y: 0.48 }, importance: 1, label: "passage" },
        ],
      },
      alt: "Seuil : la caméra franchit une ouverture.",
    },
    {
      id: "interieur",
      image: `${BASE}/scene-3.jpg`,
      depthMap: `${BASE}/depth-3.png`,
      start: 0.53,
      end: 0.79,
      // Léger travelling latéral : la crête centrale de la depth map crée un
      // parallaxe franc entre le centre (proche) et les bords (loin).
      camera: cameraPathFor("truck-right", vec3(0, 0, 2.5)),
      depth: { strength: 1.25, near: 1, far: 0 },
      transitionOut: {
        type: "DARK_FRAME",
        duration: 0.05,
        occlusionAnchor: { x: 0.72, y: 0.5 },
        direction: "right",
      },
      alt: "Intérieur : volume central proche, ouvertures latérales lointaines.",
    },
    {
      id: "ouverture",
      image: `${BASE}/scene-4.jpg`,
      depthMap: `${BASE}/depth-4.png`,
      start: 0.79,
      end: 1,
      // Fin posée : la caméra recule légèrement et s'immobilise.
      camera: cameraPathFor("reveal", vec3(0, 0, 2.7)),
      depth: { strength: 1.05, near: 1, far: 0 },
      alt: "Ouverture finale : dégagement vers l'extérieur.",
    },
  ],
  chapters: [
    { at: 0, eyebrow: "01", title: "L'approche", body: "La caméra avance : le relief se creuse." },
    { at: 0.3, eyebrow: "02", title: "Le seuil", body: "On traverse l'ouverture, sans coupure." },
    { at: 0.55, eyebrow: "03", title: "L'intérieur", side: "right", body: "Un travelling révèle le volume." },
    { at: 0.82, eyebrow: "04", title: "L'ouverture", body: "Le regard se dégage, le mouvement se pose." },
  ],
};

import type { AceMediaIntent, AceMediaStrategy, AceShotPlan } from "./types";

/**
 * ACE 0.2 — Shot planner (pur, déterministe, testable).
 *
 * Produit une structure de plans (storyboard) à partir de l'intention et de la
 * stratégie. Chaque plan porte son rôle narratif, ses états start/end, la
 * caméra, la composition, la durée cible et ses références de raccord (refIn /
 * refOut) — ce qui permet au continuity engine (qa.ts) de vérifier les
 * enchaînements. Aucun fait client inventé : ce sont des GABARITS de plans.
 */

interface ShotSeed {
  role: string;
  startState: string;
  endState: string;
  camera: AceShotPlan["cameraMove"];
  composition: string;
  focus: string;
  durationS: number;
}

/** Gabarits de plans par intention (storyboard générique premium). */
const STORYBOARDS: Record<AceMediaIntent, ShotSeed[]> = {
  "hero-cinematic": [
    {
      role: "établir l'ambiance",
      startState: "noir/voile",
      endState: "sujet révélé",
      camera: "push-in",
      composition: "large, sujet décentré",
      focus: "silhouette du sujet",
      durationS: 3,
    },
    {
      role: "révéler le détail signature",
      startState: "vue large",
      endState: "détail net",
      camera: "dolly",
      composition: "gros plan matière",
      focus: "détail distinctif",
      durationS: 3,
    },
    {
      role: "ouvrir sur la promesse",
      startState: "détail",
      endState: "vue d'ensemble tenue",
      camera: "pull-out",
      composition: "équilibrée, espace pour le titre",
      focus: "sujet + respiration",
      durationS: 4,
    },
  ],
  "room-tour": [
    {
      role: "entrer dans le lieu",
      startState: "seuil",
      endState: "pièce principale",
      camera: "dolly",
      composition: "point de fuite central",
      focus: "profondeur de la pièce",
      durationS: 4,
    },
    {
      role: "parcourir l'espace",
      startState: "pièce principale",
      endState: "second espace",
      camera: "pan",
      composition: "continuité des lignes",
      focus: "transition entre espaces",
      durationS: 4,
    },
    {
      role: "s'arrêter sur un point fort",
      startState: "second espace",
      endState: "détail d'aménagement",
      camera: "push-in",
      composition: "cadrage serré",
      focus: "élément premium du lieu",
      durationS: 3,
    },
  ],
  "project-reveal": [
    {
      role: "teaser abstrait",
      startState: "fragment flou",
      endState: "fragment net",
      camera: "static",
      composition: "macro texture",
      focus: "matière/couleur",
      durationS: 2,
    },
    {
      role: "révéler le projet",
      startState: "fragment",
      endState: "projet entier",
      camera: "pull-out",
      composition: "projet centré",
      focus: "forme globale",
      durationS: 3,
    },
    {
      role: "contextualiser",
      startState: "projet",
      endState: "projet dans son contexte",
      camera: "orbit",
      composition: "3/4",
      focus: "relation au contexte",
      durationS: 4,
    },
  ],
  "scroll-film": [
    {
      role: "ouverture",
      startState: "plan 1 début",
      endState: "plan 1 fin",
      camera: "dolly",
      composition: "cinématique",
      focus: "sujet principal",
      durationS: 5,
    },
    {
      role: "développement",
      startState: "plan 2 début",
      endState: "plan 2 fin",
      camera: "push-in",
      composition: "cinématique",
      focus: "montée d'intensité",
      durationS: 5,
    },
    {
      role: "climax",
      startState: "plan 3 début",
      endState: "plan 3 fin",
      camera: "pull-out",
      composition: "cinématique",
      focus: "résolution",
      durationS: 6,
    },
  ],
  "photo-depth": [
    {
      role: "profondeur d'une image fixe",
      startState: "image plate",
      endState: "parallaxe subtil",
      camera: "static",
      composition: "premier plan / arrière-plan séparés",
      focus: "sujet net au premier plan",
      durationS: 4,
    },
  ],
  "image-sequence": [
    {
      role: "scrub frame-perfect",
      startState: "frame de début",
      endState: "frame de fin",
      camera: "dolly",
      composition: "cadrage stable",
      focus: "objet piloté au scroll",
      durationS: 4,
    },
  ],
  "ambient-loop": [
    {
      role: "boucle d'ambiance",
      startState: "état A",
      endState: "retour état A (loop)",
      camera: "static",
      composition: "atmosphérique",
      focus: "mouvement lent continu",
      durationS: 6,
    },
  ],
};

export function buildShotPlan(intent: AceMediaIntent, strategy: AceMediaStrategy): AceShotPlan[] {
  const seeds = STORYBOARDS[intent] ?? STORYBOARDS["hero-cinematic"];
  return seeds.map((seed, i) => {
    const prev = seeds[i - 1];
    const next = seeds[i + 1];
    return {
      id: `${intent}-shot-${String(i + 1).padStart(2, "0")}`,
      narrativeRole: seed.role,
      startState: seed.startState,
      endState: seed.endState,
      cameraMove: seed.camera,
      composition: seed.composition,
      focusPoint: seed.focus,
      durationS: seed.durationS,
      // Raccords : l'état de fin d'un plan = état d'entrée du suivant.
      refIn: prev ? prev.endState : null,
      refOut: next ? seed.endState : null,
      expectedValidation:
        strategy === "webgl"
          ? "Rendu temps réel cohérent au tier ; fallback poster présent."
          : "Raccord fluide avec le plan voisin ; pas d'artefact ni de dérive du sujet.",
    };
  });
}

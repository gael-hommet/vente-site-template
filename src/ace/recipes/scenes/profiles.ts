import type { SceneProfile } from "../types";

/**
 * Profils d'intégration de scène : COMMENT le WebGL s'insère dans une page (pas
 * de nouvelles scènes — la Scene Library reste dans src/ace/scenes). Sélectionné
 * par le contrat via `design.webglIntensity` / un id. Toujours un fallback (le
 * contrat de scène l'impose) ; LITE ne monte jamais de Canvas.
 */
export const SCENE_PROFILES: readonly SceneProfile[] = [
  {
    id: "no-scene",
    title: "Sans scène",
    description: "Pur DOM/SVG, aucun Canvas. Le plus léger et le plus compatible.",
    enabled: false,
    placement: "none",
    minTier: "LITE",
  },
  {
    id: "ambient-accent",
    title: "Accent d'ambiance",
    description: "Scène discrète en accent (arrière-plan/section), non essentielle.",
    enabled: true,
    placement: "accent",
    minTier: "BALANCED",
  },
  {
    id: "product-focus",
    title: "Focus produit",
    description: "Objet 3D central manipulable (produit/maquette), reste optionnel.",
    enabled: true,
    placement: "focus",
    minTier: "BALANCED",
  },
  {
    id: "immersive-environment",
    title: "Environnement immersif",
    description: "Scène plein cadre à forte présence, réservée aux tiers capables.",
    enabled: true,
    placement: "environment",
    minTier: "ULTRA",
  },
];

import { createRegistry } from "@/ace/core";
import type { MotionRecipe } from "./contracts";

/**
 * The named Motion Library. Every entry maps to an existing, tested component
 * in src/components/motion — the registry adds the vocabulary (stable ids a
 * brief or a generator can reference) and the contract metadata. Loaders are
 * dynamic imports so listing the registry never pulls animation code.
 */

const recipes: readonly MotionRecipe[] = [
  {
    id: "reveal.soft",
    title: "Révélation douce",
    engine: "motion",
    intent: "micro",
    description: "Entrée en fondu + translation légère à l'arrivée dans le viewport.",
    reducedMotion: "final-state",
    load: () => import("@/components/motion/Reveal").then((m) => m.Reveal),
  },
  {
    id: "reveal.group",
    title: "Révélation en cascade",
    engine: "motion",
    intent: "micro",
    description: "Groupe d'éléments révélés en léger décalage (stagger).",
    reducedMotion: "final-state",
    load: () => import("@/components/motion/Reveal").then((m) => m.RevealGroup),
  },
  {
    id: "text.split",
    title: "Texte segmenté",
    engine: "motion",
    intent: "micro",
    description: "Titre animé mot à mot — alternative sans plugin premium (SplitTextFallback).",
    reducedMotion: "final-state",
    load: () => import("@/components/motion/SplitTextFallback").then((m) => m.SplitTextFallback),
  },
  {
    id: "parallax.layer",
    title: "Parallaxe légère",
    engine: "motion",
    intent: "micro",
    description: "Décalage de profondeur discret d'une couche au scroll (non cinématique).",
    reducedMotion: "disabled",
    load: () => import("@/components/motion/ParallaxLayer").then((m) => m.ParallaxLayer),
  },
  {
    id: "magnetic.cta",
    title: "Bouton magnétique",
    engine: "motion",
    intent: "micro",
    description: "Attraction du pointeur sur les CTA (désactivée sur pointeur grossier).",
    reducedMotion: "disabled",
    load: () => import("@/components/motion/MagneticButton").then((m) => m.MagneticButton),
  },
  {
    id: "pin.sequence",
    title: "Séquence épinglée",
    engine: "gsap",
    intent: "cinematic",
    skippable: true,
    description: "Section pinnée scrubbing une timeline GSAP ; le scroll natif reste maître.",
    reducedMotion: "final-state",
    load: () => import("@/components/motion/PinnedSequence").then((m) => m.PinnedSequence),
  },
  {
    id: "scene.scroll",
    title: "Scène au scroll",
    engine: "gsap",
    intent: "cinematic",
    skippable: true,
    description: "Timeline ScrollTrigger scrub liée à une section (storytelling).",
    reducedMotion: "final-state",
    load: () => import("@/components/motion/ScrollScene").then((m) => m.ScrollScene),
  },
  {
    id: "chapter.timeline",
    title: "Chapitres narratifs",
    engine: "gsap",
    intent: "cinematic",
    skippable: true,
    description: "Navigation par chapitres synchronisée sur la progression de scroll.",
    reducedMotion: "final-state",
    load: () => import("@/components/motion/ChapterTimeline").then((m) => m.ChapterTimeline),
  },
  {
    id: "progress.scroll",
    title: "Progression de lecture",
    engine: "gsap",
    intent: "cinematic",
    skippable: true,
    description: "Barre de progression de page (indicateur passif, jamais bloquant).",
    reducedMotion: "disabled",
    load: () => import("@/components/motion/ScrollProgress").then((m) => m.ScrollProgress),
  },
];

const registry = createRegistry<MotionRecipe>("motion", recipes);

export const MOTION_RECIPES = registry.list();
export const getMotionRecipe = (id: string): MotionRecipe => registry.get(id);
export const hasMotionRecipe = (id: string): boolean => registry.has(id);

import type { MotionProfile } from "../types";

/**
 * Profils Motion : orchestration de HAUT NIVEAU. Ils ne réimplémentent pas
 * GSAP/Motion/Lenis — ils fournissent les réglages (smooth-scroll, reveal,
 * durées, easing, stagger) que les recettes et le provider de scroll lisent.
 * Sélectionnés par le contrat client via `design.motionIntensity` / un id.
 */
export const MOTION_PROFILES: readonly MotionProfile[] = [
  {
    id: "restrained",
    title: "Retenu",
    description: "Transitions minimales, pas de smooth-scroll ni de reveal. Sobriété.",
    smoothScroll: false,
    revealOnScroll: false,
    durationScale: 0.6,
    ease: "out-soft",
    stagger: 0,
  },
  {
    id: "editorial",
    title: "Éditorial",
    description: "Reveals discrets au scroll, sans smooth-scroll. Rythme de lecture.",
    smoothScroll: false,
    revealOnScroll: true,
    durationScale: 1,
    ease: "out-soft",
    stagger: 0.06,
  },
  {
    id: "cinematic",
    title: "Cinématique",
    description: "Smooth-scroll + reveals + séquences plus longues. Storytelling au scroll.",
    smoothScroll: true,
    revealOnScroll: true,
    durationScale: 1.3,
    ease: "in-out-soft",
    stagger: 0.09,
  },
  {
    id: "immersive",
    title: "Immersif",
    description: "Smooth-scroll, reveals amples, easing appuyé. Expérience spatiale.",
    smoothScroll: true,
    revealOnScroll: true,
    durationScale: 1.5,
    ease: "emphasized",
    stagger: 0.12,
  },
];

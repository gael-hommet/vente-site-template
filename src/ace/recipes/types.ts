import type { ComponentType, ReactNode } from "react";

/**
 * ACE — Contrat des RECIPES.
 *
 * Une recipe est un composant de composition **générique, configurable et
 * indépendant de tout secteur/client**. Chaque famille (heroes, navigation,
 * collections, storytelling, conversion, layout) a sa forme de props partagée,
 * de sorte que plusieurs recettes d'une même famille sont interchangeables. Les
 * recettes ne portent AUCUNE identité visible : elles s'habillent via les tokens
 * du Design Language (var(--brand), var(--foreground)…), donc le même code rend
 * différemment selon le preset/DA du client.
 */

export type RecipeFamily =
  | "hero"
  | "navigation"
  | "projects"
  | "storytelling"
  | "conversion"
  | "layout";

export interface RecipeMeta {
  id: string;
  family: RecipeFamily;
  title: string;
  description: string;
  /** Étiquettes libres pour le Studio / la sélection (ex. "media-first"). */
  tags?: readonly string[];
}

/** Une recipe : métadonnées + composant typé sur les props de sa famille. */
export interface Recipe<P> extends RecipeMeta {
  Component: ComponentType<P>;
}

/* -------------------------------------------------------------------------- */
/* Props partagées par famille                                                */
/* -------------------------------------------------------------------------- */

export interface RecipeCta {
  label: string;
  href: string;
}

export interface HeroProps {
  /** Surtitre / kicker (mono, optionnel). */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  primaryCta?: RecipeCta;
  secondaryCta?: RecipeCta;
  /** Média optionnel (image). `null`/absent ⇒ variante sans média. */
  media?: { src: string; alt: string } | null;
  className?: string;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface NavProps {
  brand: string;
  links: readonly NavLink[];
  cta?: RecipeCta;
  className?: string;
}

export interface CollectionItem {
  title: string;
  href: string;
  /** Métadonnées courtes affichées (lieu, année, prix…). */
  meta?: readonly string[];
  media?: { src: string; alt: string } | null;
}

export interface ProjectsProps {
  items: readonly CollectionItem[];
  className?: string;
}

export interface StoryChapter {
  eyebrow?: string;
  title: string;
  body: string;
  media?: { src: string; alt: string } | null;
}

export interface StorytellingProps {
  chapters: readonly StoryChapter[];
  className?: string;
}

export interface ConversionProps {
  title: string;
  description?: string;
  primaryCta: RecipeCta;
  phone?: string;
  className?: string;
}

export interface LayoutProps {
  header: ReactNode;
  children: ReactNode;
  footer: ReactNode;
  className?: string;
}

/**
 * Profil Motion : orchestration de haut niveau (pas une réimplémentation de
 * GSAP/Motion/Lenis). Décrit l'intensité et les réglages que les recettes lisent
 * (durées, easings, reveal on scroll, smooth-scroll).
 */
export interface MotionProfile {
  id: string;
  title: string;
  description: string;
  /** Smooth-scroll (Lenis) actif. */
  smoothScroll: boolean;
  /** Reveal des sections au scroll. */
  revealOnScroll: boolean;
  /** Multiplicateur de durée global (0 = quasi-instantané). */
  durationScale: number;
  /** Easing d'entrée par défaut (token CSS). */
  ease: "linear" | "out-soft" | "in-out-soft" | "emphasized";
  /** Décalage de stagger (s) entre éléments d'un groupe. */
  stagger: number;
}

/**
 * Profil d'intégration de scène : COMMENT une scène s'insère (pas une nouvelle
 * scène). Détermine si/où le WebGL apparaît et son intensité.
 */
export interface SceneProfile {
  id: string;
  title: string;
  description: string;
  /** Aucune scène = pur DOM/SVG. */
  enabled: boolean;
  /** Rôle de la scène dans la page. */
  placement: "none" | "accent" | "focus" | "environment";
  /** Tier minimal pour monter le Canvas. */
  minTier: "LITE" | "BALANCED" | "ULTRA";
}

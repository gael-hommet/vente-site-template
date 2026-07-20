import type { HeroProps, CollectionItem, StoryChapter, ConversionProps } from "@/ace/recipes";

/**
 * Type du modèle de CONTENU éditorial. Séparé de la valeur (site-content.ts)
 * pour que le générateur puisse réécrire uniquement la valeur en important ce
 * type stable.
 */
export interface SiteContent {
  hero: Pick<HeroProps, "eyebrow" | "title" | "subtitle" | "primaryCta" | "secondaryCta"> & {
    /** Média du hero (immersif). `null` ⇒ variante sans média. */
    media?: { src: string; alt: string } | null;
    /** Id de scène WebGL à monter si `features.webgl` (immersif). */
    sceneId?: string;
  };
  /** Bloc narratif (storytelling recipe). */
  story: {
    heading: string;
    intro?: string;
    chapters: readonly StoryChapter[];
  };
  /** Collection (projects recipe). Vide ⇒ section masquée. */
  collection: {
    heading: string;
    intro?: string;
    /** Libellé au singulier (« projet », « chambre »…). */
    itemLabel: string;
    items: readonly CollectionItem[];
  };
  /** Point de conversion (conversion recipe). */
  conversion: Pick<ConversionProps, "title" | "description" | "primaryCta">;
  /** Liens de navigation (navigation recipe). */
  nav: readonly { label: string; href: string }[];
}

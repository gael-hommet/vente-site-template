"use client";

import * as React from "react";
import { ScrollVideo } from "./ScrollVideo";
import { ScrollImageSequence } from "./ScrollImageSequence";
import { MediaFallback } from "./MediaFallback";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { AceMediaStrategy } from "@/ace/media-engine";

/**
 * ACE 0.2 — Scroll Cinema (orchestration GÉNÉRIQUE).
 *
 * Wrapper unique qui monte la bonne technique de scroll-cinéma selon la
 * `strategy` retenue par le media-engine, au-dessus des composants EXISTANTS
 * (ScrollVideo / ScrollImageSequence / MediaFallback). Générique — jamais codé
 * pour un site précis. Gère reduced-motion (poster statique), fallback propre,
 * et overlays de chapitres/CTA sans casser l'immersion.
 *
 * Anti-low-poly : ce composant ne rend JAMAIS de 3D procédurale. Les stratégies
 * `webgl`/`hybrid` ne sont pas de son ressort (elles passent par la Scene
 * Library / AdaptiveCanvas) — ici on refuse proprement et on affiche le poster.
 */

export interface CinematicChapter {
  /** Progression [0..1] à laquelle le chapitre devient actif. */
  at: number;
  title: string;
  body?: string;
}

interface BaseProps {
  poster: string;
  alt: string;
  className?: string;
  /** Longueur du scrub, en hauteurs de viewport. */
  length?: number;
  /** Chapitres affichés en overlay (liquid glass), atteignables sans finir la scène. */
  chapters?: readonly CinematicChapter[];
  /** CTA persistant (n'entrave jamais le scroll). */
  cta?: React.ReactNode;
}

export type CinematicScrollProps = BaseProps &
  (
    | { strategy: "video-scroll"; sources: { src: string; type: string }[] }
    | { strategy: "image-sequence"; frames: string[] }
    | {
        strategy: "2.5d" | "editorial-fallback" | "webgl" | "hybrid";
        /** Pour ces stratégies, ce composant n'orchestre que le fallback. */
        sources?: never;
        frames?: never;
      }
  );

/** Overlay de chapitres + CTA, superposé au média (non bloquant). */
function CinemaOverlay({
  chapters,
  cta,
}: {
  chapters?: readonly CinematicChapter[];
  cta?: React.ReactNode;
}) {
  if (!chapters?.length && !cta) return null;
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-6">
      {chapters?.length ? (
        <ol className="glass pointer-events-auto w-fit max-w-sm rounded-[var(--radius-lg)] p-4 text-sm">
          {chapters.map((c) => (
            <li key={c.title} className="text-foreground/90">
              <span className="text-muted mr-2 font-mono text-xs">{Math.round(c.at * 100)}%</span>
              {c.title}
            </li>
          ))}
        </ol>
      ) : (
        <span />
      )}
      {cta ? <div className="pointer-events-auto self-start">{cta}</div> : null}
    </div>
  );
}

export function CinematicScroll(props: CinematicScrollProps) {
  const reduced = useReducedMotion();
  const overlay = <CinemaOverlay chapters={props.chapters} cta={props.cta} />;

  // Reduced-motion : poster statique + overlay (contenu toujours lisible).
  if (reduced) {
    return (
      <MediaFallback poster={props.poster} alt={props.alt} className={props.className}>
        {overlay}
      </MediaFallback>
    );
  }

  switch (props.strategy) {
    case "video-scroll":
      return (
        <ScrollVideo
          sources={props.sources}
          poster={props.poster}
          alt={props.alt}
          length={props.length}
          className={props.className}
          overlay={overlay}
        />
      );
    case "image-sequence":
      return (
        <ScrollImageSequence
          frames={props.frames}
          alt={props.alt}
          length={props.length}
          className={props.className}
          overlay={overlay}
        />
      );
    // 2.5d / webgl / hybrid / editorial-fallback : hors périmètre du scroll-cinéma
    // vidéo/frames. On affiche proprement le poster (jamais de 3D cheap ici).
    default:
      return (
        <MediaFallback poster={props.poster} alt={props.alt} className={props.className}>
          {overlay}
        </MediaFallback>
      );
  }
}

/** Stratégies réellement orchestrées par ce composant (les autres → fallback). */
export const CINEMATIC_SCROLL_STRATEGIES: readonly AceMediaStrategy[] = [
  "video-scroll",
  "image-sequence",
];

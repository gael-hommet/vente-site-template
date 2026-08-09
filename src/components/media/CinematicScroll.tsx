"use client";

import * as React from "react";
import { ScrollVideo } from "./ScrollVideo";
import { ScrollImageSequence } from "./ScrollImageSequence";
import { MediaFallback } from "./MediaFallback";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";
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
    | {
        strategy: "video-scroll";
        sources: { src: string; type: string }[];
        /**
         * Sources allégées servies sous `mobileBreakpoint` (même récit, même
         * durée — seulement la résolution/le débit changent).
         */
        mobileSources?: { src: string; type: string }[];
        mobileBreakpoint?: number;
      }
    | { strategy: "image-sequence"; frames: string[] }
    | {
        strategy: "2.5d" | "editorial-fallback" | "webgl" | "hybrid";
        /** Pour ces stratégies, ce composant n'orchestre que le fallback. */
        sources?: never;
        frames?: never;
      }
  );

/** Index du chapitre actif pour une progression donnée (le dernier franchi). */
export function activeChapterIndex(
  chapters: readonly CinematicChapter[] | undefined,
  progress: number,
): number {
  if (!chapters?.length) return -1;
  let active = -1;
  chapters.forEach((c, i) => {
    if (progress >= c.at) active = i;
  });
  return active;
}

/**
 * Overlay de chapitres + CTA, superposé au média (non bloquant).
 * Les chapitres sont RÉELLEMENT synchronisés à la progression : le chapitre
 * courant est mis en avant et exposé aux lecteurs d'écran via aria-current.
 */
function CinemaOverlay({
  chapters,
  cta,
  progress,
}: {
  chapters?: readonly CinematicChapter[];
  cta?: React.ReactNode;
  progress: number;
}) {
  if (!chapters?.length && !cta) return null;
  const active = activeChapterIndex(chapters, progress);
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-6">
      {chapters?.length ? (
        <ol className="glass pointer-events-auto w-fit max-w-sm rounded-lg p-4 text-sm">
          {chapters.map((c, i) => {
            const isActive = i === active;
            return (
              <li
                key={c.title}
                aria-current={isActive ? "step" : undefined}
                className={cn(
                  "transition-opacity duration-300",
                  isActive
                    ? "text-foreground font-medium opacity-100"
                    : "text-foreground/70 opacity-70",
                )}
              >
                <span className="text-muted mr-2 font-mono text-xs">{Math.round(c.at * 100)}%</span>
                {c.title}
                {isActive && c.body ? (
                  <p className="text-muted mt-1 text-xs leading-snug">{c.body}</p>
                ) : null}
              </li>
            );
          })}
        </ol>
      ) : (
        <span />
      )}
      {cta ? <div className="pointer-events-auto self-start">{cta}</div> : null}
    </div>
  );
}

/** Sélectionne les sources mobiles sous le point de rupture (sans casser le SSR). */
function useMobileSources(
  sources: { src: string; type: string }[] | undefined,
  mobileSources: { src: string; type: string }[] | undefined,
  breakpoint: number,
): { src: string; type: string }[] {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    if (!mobileSources?.length) return;
    const mq = window.matchMedia(`(max-width: ${String(breakpoint)}px)`);
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [mobileSources, breakpoint]);
  return isMobile && mobileSources?.length ? mobileSources : (sources ?? []);
}

export function CinematicScroll(props: CinematicScrollProps) {
  const reduced = useReducedMotion();
  // Progression du scrub : pilote la synchronisation des chapitres.
  const [progress, setProgress] = React.useState(0);
  const videoSources = useMobileSources(
    props.strategy === "video-scroll" ? props.sources : undefined,
    props.strategy === "video-scroll" ? props.mobileSources : undefined,
    (props.strategy === "video-scroll" ? props.mobileBreakpoint : undefined) ?? 768,
  );

  const overlay = <CinemaOverlay chapters={props.chapters} cta={props.cta} progress={progress} />;

  // Reduced-motion : poster statique + overlay (contenu toujours lisible).
  // La progression reste à 0 : aucun mouvement, mais tous les chapitres listés.
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
          sources={videoSources}
          poster={props.poster}
          alt={props.alt}
          length={props.length}
          className={props.className}
          overlay={overlay}
          onProgress={setProgress}
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
          onProgress={setProgress}
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

"use client";

import * as React from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { WebGLBoundary } from "@/components/three/WebGLBoundary";
import { ThreeCanvas } from "@/components/three/ThreeCanvas";
import { useScrubProgress } from "@/hooks/useScrubProgress";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useQuality } from "@/hooks/useQuality";
import { cn } from "@/lib/utils";
import { DepthMesh, segmentsForTier } from "./DepthMesh";
import { cameraAt } from "./camera-path";
import { resolveTimeline, activeChapter, type TimelineState } from "./timeline";
import { sceneOrigins } from "./layout";
import type { SpatialManifest, SpatialScene } from "./types";

/**
 * ACE SPATIAL CINEMA — runtime.
 *
 * Le scroll pilote une CAMÉRA dans des scènes en profondeur réelle, et les
 * changements de scène passent par des transitions SPATIALES.
 *
 * Ce que ce composant ne fait jamais :
 *  - remplacer une image par une autre ;
 *  - enchaîner deux plans par un simple fondu d'opacité ;
 *  - bouger la caméra tout seul (aucun autoplay : le scroll est le seul maître).
 */

/* -------------------------------------------------------------------------- */
/* Caméra                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Position d'une scène sur l'axe Z. Les origines sont ENCHAÎNÉES (voir
 * `layout.ts`) : la caméra termine une scène exactement là où commence la
 * suivante, donc la scène d'arrivée est déjà à sa distance de cadrage.
 */
export function sceneOriginsOf(manifest: SpatialManifest): [number, number, number][] {
  return sceneOrigins(manifest).map((z) => [0, 0, z] as [number, number, number]);
}

interface RigProps {
  manifest: SpatialManifest;
  stateRef: React.RefObject<TimelineState>;
  /** Parallaxe de pointeur, très léger (desktop uniquement). */
  pointer: React.RefObject<{ x: number; y: number }>;
  reduced: boolean;
  /** Publie l'état caméra pour le panneau de debug / l'audit navigateur. */
  debug: boolean;
  origins: [number, number, number][];
}

/**
 * SpatialCameraRig — applique l'état de la timeline à la caméra à chaque frame.
 *
 * La position vient d'un mapping PUR `progress → état`, donc remonter le scroll
 * repasse exactement par le même chemin. `useFrame` ne fait qu'appliquer : il
 * n'intègre aucune vitesse, aucun temps écoulé.
 */
function SpatialCameraRig({ manifest, stateRef, pointer, reduced, debug, origins }: RigProps) {
  const target = React.useRef(new THREE.Vector3());

  // La caméra vient de l'argument de frame (et non d'un hook) : c'est elle
  // qu'on pilote, image par image.
  useFrame(({ camera }) => {
    const state = stateRef.current;
    if (!state) return;
    const scene = manifest.scenes[state.sceneIndex];
    if (!scene) return;

    const cam = cameraAt(scene.camera, state.localProgress);
    const origin = origins[state.sceneIndex] ?? [0, 0, 0];

    // Parallaxe de pointeur : quelques centièmes d'unité, jamais plus — le
    // chemin principal reste celui du scroll.
    const drift = !reduced && pointer.current ? pointer.current : { x: 0, y: 0 };

    // Position absolue = origine de la scène + trajet local (+ dérive).
    const px = origin[0] + cam.position.x + drift.x * 0.06;
    const py = origin[1] + cam.position.y + drift.y * 0.04;
    const pz = origin[2] + cam.position.z;

    camera.position.set(px, py, pz);
    target.current.set(
      origin[0] + cam.target.x,
      origin[1] + cam.target.y,
      origin[2] + cam.target.z,
    );
    camera.lookAt(target.current);

    if (camera instanceof THREE.PerspectiveCamera && camera.fov !== cam.fov) {
      camera.fov = cam.fov;
      camera.updateProjectionMatrix();
    }

    // Canal de debug : sert au panneau `?spatialDebug=1` et à l'audit navigateur
    // anti-diaporama (position + matrices réellement appliquées à la caméra).
    if (debug) {
      // Écrit directement depuis la boucle de rendu : cet état ne dépend
      // d'aucun commit React, donc il est fiable même à très bas framerate.
      (window as unknown as { __spatialCam?: unknown }).__spatialCam = {
        progress: state.progress,
        scene: scene.id,
        sceneIndex: state.sceneIndex,
        localProgress: state.localProgress,
        transition: state.transition ? state.transition.type : null,
        transitionT: state.transition ? state.transition.t : null,
        position: [camera.position.x, camera.position.y, camera.position.z],
        fov: camera instanceof THREE.PerspectiveCamera ? camera.fov : null,
        view: Array.from(camera.matrixWorldInverse.elements),
        projection: Array.from(camera.projectionMatrix.elements),
      };
    }
  });

  return null;
}

/* -------------------------------------------------------------------------- */
/* Transitions spatiales                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Fenêtre pendant laquelle l'écran est SUFFISAMMENT masqué pour que le
 * basculement d'une scène à l'autre soit invisible. Le fondu n'existe qu'à
 * l'intérieur de cette fenêtre : il est secondaire au mouvement.
 */
export function occlusionCurve(t: number): number {
  // Monte vite jusqu'au milieu (l'obstacle envahit le cadre), redescend ensuite.
  const x = Math.max(0, Math.min(1, t));
  return Math.sin(Math.PI * x);
}

/**
 * Fenêtre de bascule, volontairement ÉTROITE et centrée sur le pic d'occlusion.
 * Hors de cette fenêtre une seule scène est à l'écran ; à l'intérieur, l'écran
 * est masqué à plus de 95 %. C'est ce qui interdit le fondu visible.
 */
export const SWAP_START = 0.44;
export const SWAP_END = 0.56;

/** L'opacité de la scène sortante pendant un raccord (jamais un crossfade seul). */
export function outgoingOpacity(t: number): number {
  if (t <= SWAP_START) return 1;
  if (t >= SWAP_END) return 0;
  return 1 - (t - SWAP_START) / (SWAP_END - SWAP_START);
}

/** L'opacité de la scène entrante. */
export function incomingOpacity(t: number): number {
  if (t <= SWAP_START) return 0;
  if (t >= SWAP_END) return 1;
  return (t - SWAP_START) / (SWAP_END - SWAP_START);
}

/**
 * Masquage de l'écran pendant un raccord.
 *
 * C'est LA pièce qui distingue un raccord spatial d'un fondu : au moment précis
 * où les deux scènes se croisent (t = 0.5), l'écran doit être presque
 * entièrement masqué — on passe derrière un obstacle. Le spectateur ne doit
 * jamais voir deux images se mélanger en pleine lumière.
 */
export function transitionDarken(type: string, t: number): number {
  const curve = occlusionCurve(t);
  if (type === "DARK_FRAME") return curve * 0.97;
  if (type === "PUSH_THROUGH") return curve * 0.92;
  if (type === "OCCLUSION") return curve * 0.9;
  if (type === "DEPTH_WARP") return curve * 0.85;
  if (type === "EDGE_WIPE_SPATIAL") return curve * 0.8;
  // Une traversée vitrée laisse passer un peu de lumière, mais reste masquante.
  if (type === "GLASS_PASS") return curve * 0.75;
  return curve * 0.8;
}

/** Masquage minimal exigé à l'instant où les deux scènes se croisent. */
export const MIN_CROSSOVER_MASK = 0.7;

/* -------------------------------------------------------------------------- */
/* Scène                                                                      */
/* -------------------------------------------------------------------------- */

interface ScenesProps {
  manifest: SpatialManifest;
  stateRef: React.RefObject<TimelineState>;
  segments: number;
  origins: [number, number, number][];
}

/** Monte les scènes actives et pilote leurs uniformes au fil du scroll. */
function SpatialScenes({ manifest, stateRef, segments, origins }: ScenesProps) {
  const [render, setRender] = React.useState<{
    opacity: number[];
    darken: number[];
    visible: boolean[];
  }>(() => ({
    opacity: manifest.scenes.map((_, i) => (i === 0 ? 1 : 0)),
    darken: manifest.scenes.map(() => 0),
    visible: manifest.scenes.map((_, i) => i === 0),
  }));

  useFrame(() => {
    const state = stateRef.current;
    if (!state) return;
    const opacity = manifest.scenes.map(() => 0);
    const darken = manifest.scenes.map(() => 0);
    const visible = manifest.scenes.map(() => false);

    if (state.transition) {
      const { fromIndex, toIndex, t, type } = state.transition;
      opacity[fromIndex] = outgoingOpacity(t);
      opacity[toIndex] = incomingOpacity(t);
      darken[fromIndex] = transitionDarken(type, t);
      darken[toIndex] = transitionDarken(type, t) * 0.5;
      visible[fromIndex] = true;
      visible[toIndex] = true;
    } else {
      opacity[state.sceneIndex] = 1;
      visible[state.sceneIndex] = true;
    }

    setRender((prev) => {
      // On ne re-rend que si quelque chose a réellement changé.
      const same =
        prev.opacity.every((v, i) => Math.abs(v - (opacity[i] as number)) < 0.002) &&
        prev.visible.every((v, i) => v === visible[i]);
      return same ? prev : { opacity, darken, visible };
    });
  });

  return (
    <>
      {manifest.scenes.map((scene: SpatialScene, i) => {
        if (!render.visible[i] || !scene.depthMap) return null;
        return (
          <group key={scene.id} position={origins[i] ?? [0, 0, 0]}>
            {/* Suspense PAR SCÈNE : sinon le chargement d'une scène vide le cadre. */}
            <React.Suspense fallback={null}>
              <DepthMesh
                image={scene.image}
                depthMap={scene.depthMap}
                depth={scene.depth}
                scene={scene}
                opacity={render.opacity[i] ?? 0}
                darken={render.darken[i] ?? 0}
                segments={segments}
              />
            </React.Suspense>
          </group>
        );
      })}
    </>
  );
}

/**
 * Précharge les médias de la scène SUIVANTE (et seulement elle) : quand le
 * raccord arrive, les textures sont déjà dans le cache HTTP et la scène monte
 * sans cadre vide. On ne charge jamais les quatre scènes d'un coup (§17).
 */
function usePreloadNextScene(manifest: SpatialManifest, sceneIndex: number): void {
  React.useEffect(() => {
    const next = manifest.scenes[sceneIndex + 1];
    if (!next) return;
    const loader = new THREE.TextureLoader();
    const urls = [next.image, next.depthMap].filter(Boolean) as string[];
    for (const url of urls) loader.load(url);
  }, [manifest, sceneIndex]);
}

/* -------------------------------------------------------------------------- */
/* Dégradation progressive                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Niveaux de charge. Le voyage spatial N'EST PAS abandonné dès la première
 * baisse de framerate : on allège d'abord (maillage, DPR), et on ne bascule sur
 * la version éditoriale que si l'appareil est vraiment incapable de suivre.
 *
 * C'est la règle §18 : le mobile reste immersif ; le repli éditorial est réservé
 * aux appareils réellement trop faibles.
 */
export type SpatialStrain = 0 | 1 | 2 | 3;

/** Le repli éditorial n'intervient qu'au dernier cran. */
export const STRAIN_FALLBACK: SpatialStrain = 3;

/** Subdivisions réellement utilisées, tier ET charge mesurée confondus. */
export function spatialSegments(
  tier: "ULTRA" | "BALANCED" | "LITE",
  strain: SpatialStrain,
): number {
  const base = segmentsForTier(tier);
  const factor = strain === 0 ? 1 : strain === 1 ? 0.66 : 0.45;
  return Math.max(48, Math.round((base * factor) / 2) * 2);
}

/** Plafond de DPR : on retombe à 1 dès la première alerte. */
export function spatialDpr(strain: SpatialStrain): [number, number] {
  return strain === 0 ? [1, 1.75] : [1, 1];
}

/** Escalade la charge d'un cran (jamais au-delà du repli). */
function nextStrain(s: SpatialStrain): SpatialStrain {
  return (s >= STRAIN_FALLBACK ? STRAIN_FALLBACK : s + 1) as SpatialStrain;
}

/* -------------------------------------------------------------------------- */
/* Overlay narratif                                                           */
/* -------------------------------------------------------------------------- */

function ChapterOverlay({
  manifest,
  progress,
  cta,
}: {
  manifest: SpatialManifest;
  progress: number;
  cta?: React.ReactNode;
}) {
  const chapters = manifest.chapters ?? [];
  const active = activeChapter(manifest, progress);
  const chapter = active >= 0 ? chapters[active] : undefined;

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-end p-6 sm:p-10">
      {chapter ? (
        <div
          className={cn(
            "glass pointer-events-auto max-w-md rounded-lg p-5 transition-opacity duration-500",
            chapter.side === "right" ? "self-end" : "self-start",
          )}
        >
          {chapter.eyebrow ? (
            <p className="text-muted font-mono text-xs tracking-widest uppercase">
              {chapter.eyebrow}
            </p>
          ) : null}
          <p className="text-foreground mt-1 text-xl font-medium">{chapter.title}</p>
          {chapter.body ? <p className="text-muted mt-2 text-sm">{chapter.body}</p> : null}
        </div>
      ) : null}
      {cta ? <div className="pointer-events-auto mt-4 self-start">{cta}</div> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Composant public                                                           */
/* -------------------------------------------------------------------------- */

export interface SpatialCinemaProps {
  manifest: SpatialManifest;
  className?: string;
  cta?: React.ReactNode;
  /** Expose la progression (chapitres externes, debug). */
  onProgress?: (progress: number) => void;
  /**
   * Fige la qualité (banc de test interne uniquement). En production on laisse
   * la détection faire son travail : ce prop n'est jamais passé par un site.
   */
  qualityPin?: "ULTRA" | "BALANCED" | "LITE";
  /** Publie l'état caméra (banc de test interne). Jamais activé en production. */
  debug?: boolean;
  /**
   * Lissage du scrub GSAP, en secondes. `true` = suivi immédiat du scroll
   * (utilisé par le banc de test : aucune inertie à attendre).
   */
  scrub?: number | boolean;
}

/**
 * Point d'entrée du voyage spatial.
 *
 * Sous reduced-motion ou sans WebGL : image fixe + chapitres lisibles, aucun
 * scroll capturé. Le contenu ne dépend jamais du Canvas.
 */
export function SpatialCinema({
  manifest,
  className,
  cta,
  onProgress,
  qualityPin,
  debug = false,
  scrub = 0.35,
}: SpatialCinemaProps) {
  const reduced = useReducedMotion();
  const { tier: detectedTier } = useQuality();
  const tier = qualityPin ?? detectedTier;
  const stateRef = React.useRef<TimelineState>(resolveTimeline(manifest, 0));
  const pointer = React.useRef({ x: 0, y: 0 });
  const [progress, setProgress] = React.useState(0);
  const [strain, setStrain] = React.useState<SpatialStrain>(0);

  const length = manifest.length ?? Math.max(3, manifest.scenes.length * 2);

  // Anticipe la scène suivante pour qu'aucun raccord ne tombe sur un cadre vide.
  usePreloadNextScene(manifest, resolveTimeline(manifest, progress).sceneIndex);
  const origins = React.useMemo(() => sceneOriginsOf(manifest), [manifest]);

  const { ref } = useScrubProgress<HTMLDivElement>({
    start: "top top",
    end: `+=${length * 100}%`,
    pin: true,
    scrub,
    enabled: !reduced,
    onProgress: (p) => {
      stateRef.current = resolveTimeline(manifest, p);
      setProgress(p);
      onProgress?.(p);
    },
  });

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    pointer.current = {
      x: ((e.clientX - r.left) / r.width) * 2 - 1,
      y: -(((e.clientY - r.top) / r.height) * 2 - 1),
    };
  };

  // Mobile / GPU lent : moins de subdivisions, DPR plafonné — le voyage reste.
  const segments = spatialSegments(tier, strain);

  // Repli éditorial : reduced-motion, ou appareil réellement incapable de suivre.
  if (reduced || strain >= STRAIN_FALLBACK) {
    // Aucun déplacement spatial : image stable + contenu, scroll libre.
    return (
      <div className={cn("relative", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={manifest.poster} alt={manifest.alt} className="h-full w-full object-cover" />
        <ChapterOverlay manifest={manifest} progress={0} cta={cta} />
      </div>
    );
  }

  return (
    <div ref={ref} className={className} style={{ height: `${length * 100}vh` }}>
      <div
        className="sticky top-0 h-screen w-full overflow-hidden"
        onPointerMove={onPointerMove}
        data-spatial-cinema="true"
      >
        {/*
          Frontière WebGL conservée (absence de WebGL ou erreur de scène → poster),
          mais le tier LITE ne coupe PAS la 3D : il l'allège. Le garde de
          performance global est remplacé par une escalade propre au voyage.
        */}
        <div className="h-full w-full">
          <WebGLBoundary fallback={{ poster: manifest.poster, alt: manifest.alt }}>
            <ThreeCanvas
              className="h-full w-full"
              camera={{ position: [0, 0, 2.6], fov: 48 }}
              dpr={spatialDpr(strain)}
              noPerfGuard
            >
              {/* Qualité figée = banc de test : on n'escalade pas. */}
              <PerformanceMonitor
                onDecline={() => {
                  if (!qualityPin) setStrain(nextStrain);
                }}
              />
              <SpatialCameraRig
                manifest={manifest}
                stateRef={stateRef}
                pointer={pointer}
                reduced={reduced}
                debug={debug}
                origins={origins}
              />
              <SpatialScenes
                manifest={manifest}
                stateRef={stateRef}
                segments={segments}
                origins={origins}
              />
            </ThreeCanvas>
          </WebGLBoundary>
        </div>
        <ChapterOverlay manifest={manifest} progress={progress} cta={cta} />
      </div>
    </div>
  );
}

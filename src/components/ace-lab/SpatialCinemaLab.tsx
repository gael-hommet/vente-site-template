"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { SpatialCinema } from "@/ace/spatial-cinema/SpatialCinema";
import { SPATIAL_FIXTURE } from "@/ace/spatial-cinema/fixture";
import { resolveTimeline } from "@/ace/spatial-cinema";

/**
 * Banc d'essai du Spatial Cinema. `?spatialDebug=1` affiche l'état interne
 * (scène, progression locale, transition) — jamais actif sans le paramètre.
 */
export function SpatialCinemaLab() {
  const [progress, setProgress] = React.useState(0);

  // Lecture directe des paramètres : pas de setState dans un effet.
  const params = useSearchParams();
  const debug = params.get("spatialDebug") === "1";
  const tierParam = params.get("spatialTier")?.toUpperCase();
  const pin =
    tierParam === "ULTRA" || tierParam === "BALANCED" || tierParam === "LITE"
      ? tierParam
      : undefined;
  // Banc de test : supprime l'inertie du scrub pour capturer un point précis.
  const instantScrub = params.get("spatialScrub") === "0";

  const state = resolveTimeline(SPATIAL_FIXTURE, progress);

  return (
    <main>
      <h1 className="sr-only">Spatial Cinema — démonstration</h1>
      <SpatialCinema
        manifest={SPATIAL_FIXTURE}
        onProgress={setProgress}
        qualityPin={pin}
        debug={debug}
        scrub={instantScrub ? true : 0.35}
        cta={
          <a
            href="/contact"
            className="bg-accent text-accent-foreground inline-flex rounded-full px-5 py-3 text-sm font-medium"
          >
            Nous contacter
          </a>
        }
      />
      {debug ? (
        <div
          data-spatial-debug="true"
          data-progress={progress.toFixed(4)}
          data-scene={SPATIAL_FIXTURE.scenes[state.sceneIndex]?.id}
          data-scene-index={String(state.sceneIndex)}
          data-local={state.localProgress.toFixed(4)}
          data-transition={state.transition ? state.transition.type : ""}
          data-transition-t={state.transition ? state.transition.t.toFixed(3) : ""}
          data-tier={pin ?? "auto"}
          className="glass fixed top-4 left-4 z-50 rounded-lg p-3 font-mono text-xs"
        >
          <div>progress : {progress.toFixed(3)}</div>
          <div>scène : {SPATIAL_FIXTURE.scenes[state.sceneIndex]?.id}</div>
          <div>local : {state.localProgress.toFixed(3)}</div>
          <div>
            transition :{" "}
            {state.transition ? `${state.transition.type} ${state.transition.t.toFixed(2)}` : "—"}
          </div>
        </div>
      ) : null}
      <section className="mx-auto max-w-2xl p-10">
        <h2 className="text-2xl font-medium">Après le voyage</h2>
        <p className="text-muted mt-2">
          Le contenu reste accessible : le scroll n&apos;est jamais confisqué.
        </p>
      </section>
    </main>
  );
}

"use client";

import * as React from "react";
import type { ComponentType } from "react";
import dynamic from "next/dynamic";
import { AdaptiveCanvas } from "@/components/three/AdaptiveCanvas";
import { SCENES } from "@/ace/scenes/registry";
import { QUALITY_BUDGETS } from "@/lib/performance/quality";
import { QualitySelector } from "@/components/lab/QualitySelector";
import { useQuality } from "@/hooks/useQuality";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Scene Studio: mounts any Scene Library entry through the real adaptive
 * chain and lets you exercise every degradation path — tier override
 * (ULTRA/BALANCED/LITE), forced fallback, and a genuine WebGL context-loss
 * simulation (WEBGL_lose_context). Camera, lights, materials and
 * postprocessing live inside the scenes; postprocessing only runs on ULTRA.
 */

const SCENE_COMPONENTS: Readonly<Record<string, ComponentType<object>>> = Object.fromEntries(
  SCENES.map((definition) => [
    definition.id,
    dynamic(
      () => definition.load().then((Scene) => ({ default: Scene as ComponentType<object> })),
      { ssr: false, loading: () => null },
    ),
  ]),
);

export function SceneStudio() {
  const [sceneId, setSceneId] = React.useState(SCENES[0].id);
  const [forceFallback, setForceFallback] = React.useState(false);
  const [contextNote, setContextNote] = React.useState<string | null>(null);
  const { tier } = useQuality();
  const containerRef = React.useRef<HTMLDivElement>(null);

  const scene = SCENES.find((s) => s.id === sceneId) ?? SCENES[0];
  const Scene = SCENE_COMPONENTS[scene.id];
  const budget = QUALITY_BUDGETS[tier];

  const loseContext = () => {
    const canvas = containerRef.current?.querySelector("canvas");
    const gl =
      (canvas?.getContext("webgl2") as WebGL2RenderingContext | null) ??
      (canvas?.getContext("webgl") as WebGLRenderingContext | null);
    const ext = gl?.getExtension("WEBGL_lose_context");
    if (!ext) {
      setContextNote("Pas de contexte WebGL actif (fallback affiché) — rien à perdre.");
      return;
    }
    ext.loseContext();
    setContextNote("Contexte WebGL perdu — restauration dans 2 s…");
    window.setTimeout(() => {
      ext.restoreContext();
      setContextNote("Contexte restauré : la scène doit être revenue sans rechargement.");
    }, 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Scène (registre)</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Choix de la scène">
            {SCENES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSceneId(s.id)}
                aria-pressed={sceneId === s.id}
                className={cn(
                  "rounded-full border px-4 py-1.5 font-mono text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[var(--ring)]",
                  sceneId === s.id
                    ? "border-brand bg-brand text-brand-foreground"
                    : "border-border text-muted hover:text-foreground",
                )}
              >
                {s.id}
              </button>
            ))}
          </div>
        </div>
        <QualitySelector />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          aria-pressed={forceFallback}
          onClick={() => setForceFallback((v) => !v)}
        >
          {forceFallback ? "Réactiver WebGL" : "Forcer le fallback"}
        </Button>
        <Button variant="outline" size="sm" onClick={loseContext}>
          Simuler une perte de contexte WebGL
        </Button>
        {contextNote ? (
          <p className="text-muted text-sm" role="status">
            {contextNote}
          </p>
        ) : null}
      </div>

      <div ref={containerRef}>
        <AdaptiveCanvas
          className="border-border bg-surface-2 aspect-[16/9] w-full overflow-hidden rounded-[var(--radius-lg)] border"
          fallback={scene.fallback}
          forceFallback={forceFallback}
        >
          <Scene />
        </AdaptiveCanvas>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <p className="mb-2 text-sm font-semibold">Contrat de la scène</p>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted">Moteur</dt>
            <dd>{scene.engine}</dd>
            <dt className="text-muted">Tier minimum</dt>
            <dd>{scene.minTier}</dd>
            <dt className="text-muted">Passable</dt>
            <dd>{scene.skippable ? "oui" : "—"}</dd>
            <dt className="text-muted">Fallback</dt>
            <dd className="truncate">{scene.fallback.alt}</dd>
          </dl>
          <p className="text-muted mt-3 text-xs">{scene.description}</p>
        </Card>
        <Card className="p-5">
          <p className="mb-2 text-sm font-semibold">Budget appliqué — tier {tier}</p>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted">DPR max</dt>
            <dd className="tabular-nums">
              {budget.dpr[0]}–{budget.dpr[1]}
            </dd>
            <dt className="text-muted">Ombres</dt>
            <dd>{budget.shadows ? "oui" : "non"}</dd>
            <dt className="text-muted">Postprocessing</dt>
            <dd>{budget.postprocessing ? "oui (ULTRA)" : "non"}</dd>
            <dt className="text-muted">Texture max</dt>
            <dd className="tabular-nums">{budget.maxTextureSize}px</dd>
            <dt className="text-muted">FPS cible</dt>
            <dd className="tabular-nums">{budget.targetFps}</dd>
          </dl>
          <p className="text-muted mt-3 text-xs">
            En LITE, WebGL ne démarre jamais : le fallback (poster/vidéo) est rendu directement.
            Caméra, lumières et matériaux vivent dans chaque scène du registre.
          </p>
        </Card>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { registerGsap, ScrollTrigger } from "@/lib/animation/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useSmoothScroll } from "@/components/motion/SmoothScrollProvider";
import { useQuality } from "@/hooks/useQuality";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { SplitTextFallback } from "@/components/motion/SplitTextFallback";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/** GSAP timeline type derived from the central setup (no direct gsap import). */
type Timeline = ReturnType<ReturnType<typeof registerGsap>["timeline"]>;

/**
 * Interactive motion playground:
 * - replays the Motion micro-recipes on demand (fresh mount each run);
 * - a scrubbable GSAP timeline (play / pause / restart / progress slider);
 * - live orchestration status: Lenis, ScrollTrigger count, reduced-motion,
 *   save-data. Everything honors prefers-reduced-motion.
 */
export function MotionPlayground() {
  const reduced = useReducedMotion();
  const { getLenis } = useSmoothScroll();
  const { profile } = useQuality();
  const [runId, setRunId] = React.useState(0);
  const [progress, setProgress] = React.useState(0);
  const [stCount, setStCount] = React.useState(0);
  const [lenisActive, setLenisActive] = React.useState(false);

  const stageRef = React.useRef<HTMLDivElement>(null);
  const timelineRef = React.useRef<Timeline | null>(null);

  // Build the demo timeline (paused; scrubbed via the slider).
  React.useEffect(() => {
    const stage = stageRef.current;
    if (!stage || reduced) return;
    const gsap = registerGsap();
    const boxes = stage.querySelectorAll("[data-tl-box]");
    const tl = gsap
      .timeline({ paused: true, onUpdate: () => setProgress(tl.progress()) })
      .to(boxes[0], { x: 160, rotation: 90, duration: 0.6, ease: "power3.out" })
      .to(boxes[1], { scale: 1.4, duration: 0.4, ease: "power2.inOut" }, "-=0.3")
      .to(boxes[2], { y: -28, opacity: 1, duration: 0.5, ease: "expo.out" }, "-=0.2")
      .to(boxes, { filter: "brightness(1.2)", duration: 0.3 });
    timelineRef.current = tl;
    return () => {
      tl.kill();
      timelineRef.current = null;
    };
  }, [reduced, runId]);

  // Live orchestration status.
  React.useEffect(() => {
    const update = () => {
      setStCount(ScrollTrigger.getAll().length);
      setLenisActive(getLenis() !== null);
    };
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [getLenis]);

  const scrub = (value: number) => {
    setProgress(value);
    timelineRef.current?.progress(value).pause();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Micro-interactions (Motion) */}
      <Card className="flex flex-col gap-4 p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold">Micro-interactions (Motion)</p>
          <Button variant="outline" size="sm" onClick={() => setRunId((n) => n + 1)}>
            Rejouer
          </Button>
        </div>
        <div key={runId} className="flex flex-col gap-4">
          <SplitTextFallback text="Texte segmenté animé" className="text-xl font-semibold" as="p" />
          <RevealGroup>
            <div className="grid grid-cols-3 gap-3">
              {["reveal.soft", "reveal.group", "magnetic.cta"].map((id) => (
                <Reveal key={id}>
                  <div className="bg-surface-2 rounded-[var(--radius-md)] p-3 text-center font-mono text-xs">
                    {id}
                  </div>
                </Reveal>
              ))}
            </div>
          </RevealGroup>
          <MagneticButton className="self-start">
            <Button>Bouton magnétique</Button>
          </MagneticButton>
        </div>
        {reduced ? (
          <p className="text-muted text-xs">
            prefers-reduced-motion actif : états finaux rendus sans animation.
          </p>
        ) : null}
      </Card>

      {/* GSAP timeline — scrubbable */}
      <Card className="flex flex-col gap-4 p-6">
        <p className="font-semibold">Timeline GSAP (scrub manuel)</p>
        {reduced ? (
          <p className="text-muted text-sm">
            prefers-reduced-motion actif : la timeline est neutralisée, le contenu reste lisible.
          </p>
        ) : (
          <>
            <div
              ref={stageRef}
              className="bg-surface-2 relative flex h-32 items-center gap-6 overflow-hidden rounded-[var(--radius-md)] px-6"
            >
              <div data-tl-box className="bg-brand size-10 rounded-[var(--radius-sm)]" />
              <div data-tl-box className="bg-brand-strong size-10 rounded-full" />
              <div
                data-tl-box
                className="border-brand size-10 rounded-[var(--radius-sm)] border-2 opacity-40"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => timelineRef.current?.play()}>
                Lire
              </Button>
              <Button size="sm" variant="outline" onClick={() => timelineRef.current?.pause()}>
                Pause
              </Button>
              <Button size="sm" variant="outline" onClick={() => timelineRef.current?.restart()}>
                Recommencer
              </Button>
            </div>
            <label className="flex items-center gap-3 text-sm">
              <span className="text-muted w-14">Scrub</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={progress}
                onChange={(e) => scrub(Number(e.target.value))}
                className="accent-brand w-full"
                aria-label="Position dans la timeline"
              />
              <span className="w-12 text-right font-mono text-xs tabular-nums">
                {(progress * 100).toFixed(0)}%
              </span>
            </label>
          </>
        )}
      </Card>

      {/* Orchestration status */}
      <Card className="p-6 lg:col-span-2">
        <p className="mb-3 font-semibold">Orchestration GSAP / Motion / Lenis</p>
        <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-muted">Lenis (smooth scroll)</dt>
            <dd className="font-medium">{lenisActive ? "actif · ticker GSAP" : "désactivé"}</dd>
          </div>
          <div>
            <dt className="text-muted">ScrollTriggers montés</dt>
            <dd className="font-medium tabular-nums">{stCount}</dd>
          </div>
          <div>
            <dt className="text-muted">Reduced motion</dt>
            <dd className="font-medium">{reduced ? "ACTIF" : "inactif"}</dd>
          </div>
          <div>
            <dt className="text-muted">Save-data</dt>
            <dd className="font-medium">{profile.saveData ? "actif" : "inactif"}</dd>
          </div>
        </dl>
        <p className="text-muted mt-3 text-xs">
          Un seul pilote de scroll : Lenis alimente le ticker GSAP et notifie ScrollTrigger — coupé
          sous reduced-motion (scroll natif). Les séquences cinématiques au scroll se testent sur{" "}
          <code>/lab</code>.
        </p>
      </Card>
    </div>
  );
}

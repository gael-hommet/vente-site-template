"use client";

import * as React from "react";
import {
  ImageSequencePlayer,
  type ImageSequenceHandle,
} from "@/components/media/ImageSequencePlayer";

const FRAME_COUNT = 48;

/**
 * Generates a lightweight image sequence LOCALLY (no committed assets): each
 * frame is drawn to an offscreen canvas and exported as a data URL, then fed to
 * ImageSequencePlayer. A slider scrubs it — demonstrating the canvas frame
 * player without shipping hundreds of files.
 */
export function ImageSequenceDemo() {
  const [frames, setFrames] = React.useState<string[]>([]);
  const [pos, setPos] = React.useState(0);
  const playerRef = React.useRef<ImageSequenceHandle>(null);

  React.useEffect(() => {
    let cancelled = false;
    // Defer generation past the initial commit (keeps the effect body free of a
    // synchronous setState and shows the "generating" state for one frame).
    const raf = requestAnimationFrame(() => {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 400;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const out: string[] = [];
      for (let i = 0; i < FRAME_COUNT; i++) {
        const t = i / (FRAME_COUNT - 1);
        ctx.fillStyle = "#141826";
        ctx.fillRect(0, 0, 640, 400);
        ctx.save();
        ctx.translate(320, 200);
        ctx.rotate(t * Math.PI * 2);
        const hue = Math.round(240 + t * 120);
        ctx.fillStyle = `hsl(${hue} 80% 60%)`;
        ctx.fillRect(-70, -70, 140, 140);
        ctx.fillStyle = "rgba(255,255,255,.9)";
        ctx.fillRect(-8, -110, 16, 60);
        ctx.restore();
        out.push(canvas.toDataURL("image/webp", 0.7));
      }
      if (!cancelled) setFrames(out);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  if (frames.length === 0) {
    return (
      <div className="text-muted grid h-64 place-items-center text-sm">Génération des frames…</div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="border-border bg-surface-2 aspect-[16/10] w-full overflow-hidden rounded-[var(--radius-lg)] border">
        <ImageSequencePlayer
          ref={playerRef}
          frames={frames}
          alt="Séquence d'images générée localement"
          preload="sequential"
        />
      </div>
      <label className="text-muted text-sm" htmlFor="seq-range">
        Position ({Math.round(pos * 100)}%)
      </label>
      <input
        id="seq-range"
        type="range"
        min={0}
        max={100}
        value={pos * 100}
        onChange={(e) => {
          const p = Number(e.target.value) / 100;
          setPos(p);
          playerRef.current?.seek(p);
        }}
        className="accent-brand w-full"
      />
    </div>
  );
}

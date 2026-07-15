"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface Chapter {
  id: string;
  label: string;
}

/**
 * A vertical chapter indicator for a cinematic narrative. Given the active
 * chapter (derive it from a PinnedSequence's progress), it highlights the
 * current step and lets keyboard users jump between chapters. Purely a
 * navigation aid — never the only way to reach content.
 */
export function ChapterTimeline({
  chapters,
  activeIndex,
  onSelect,
  className,
}: {
  chapters: Chapter[];
  activeIndex: number;
  onSelect?: (index: number, chapter: Chapter) => void;
  className?: string;
}) {
  return (
    <nav
      aria-label="Chapitres"
      className={cn("flex flex-col gap-3", className)}
    >
      {chapters.map((chapter, i) => {
        const active = i === activeIndex;
        return (
          <button
            key={chapter.id}
            type="button"
            onClick={() => onSelect?.(i, chapter)}
            aria-current={active ? "step" : undefined}
            className="group flex items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-[var(--ring)]"
          >
            <span
              aria-hidden
              className={cn(
                "h-6 w-0.5 rounded-full transition-colors",
                active ? "bg-brand" : "bg-border group-hover:bg-muted",
              )}
            />
            <span
              className={cn(
                "text-sm transition-colors",
                active ? "font-medium text-foreground" : "text-muted",
              )}
            >
              {chapter.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

/** Map a 0..1 progress to an active chapter index. */
export function chapterIndexFromProgress(progress: number, count: number): number {
  if (count <= 0) return 0;
  return Math.min(count - 1, Math.floor(progress * count));
}

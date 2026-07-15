import * as React from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

/** Inline spinner. Decorative by default; pass a label for standalone use. */
export function Spinner({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span role={label ? "status" : undefined} className="inline-flex items-center gap-2">
      <Loader2 className={cn("size-5 animate-spin text-brand motion-reduce:animate-none", className)} aria-hidden />
      {label ? <span className="text-sm text-muted">{label}</span> : null}
    </span>
  );
}

/** Full-block loading placeholder. */
export function LoadingState({ label = "Chargement…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-40 w-full flex-col items-center justify-center gap-3 text-muted"
    >
      <Loader2 className="size-6 animate-spin text-brand motion-reduce:animate-none" aria-hidden />
      <span className="text-sm">{label}</span>
    </div>
  );
}

/** Skeleton shimmer block. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[var(--radius-md)] bg-surface-2 motion-reduce:animate-none",
        className,
      )}
    />
  );
}

/** Accessible error panel with optional retry. */
export function ErrorState({
  title = "Une erreur est survenue",
  description,
  onRetry,
  retryLabel = "Réessayer",
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex min-h-40 w-full flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-6 text-center",
        className,
      )}
    >
      <AlertTriangle className="size-6 text-warning" aria-hidden />
      <p className="font-semibold text-foreground">{title}</p>
      {description ? <p className="max-w-sm text-sm text-muted">{description}</p> : null}
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-1">
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}

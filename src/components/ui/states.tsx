import * as React from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

/** Inline spinner. Decorative by default; pass a label for standalone use. */
export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <span role={label ? "status" : undefined} className="inline-flex items-center gap-2">
      <Loader2
        className={cn("text-brand size-5 animate-spin motion-reduce:animate-none", className)}
        aria-hidden
      />
      {label ? <span className="text-muted text-sm">{label}</span> : null}
    </span>
  );
}

/** Full-block loading placeholder. */
export function LoadingState({ label = "Chargement…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="text-muted flex min-h-40 w-full flex-col items-center justify-center gap-3"
    >
      <Loader2 className="text-brand size-6 animate-spin motion-reduce:animate-none" aria-hidden />
      <span className="text-sm">{label}</span>
    </div>
  );
}

/** Skeleton shimmer block. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-surface-2 animate-pulse rounded-[var(--radius-md)] motion-reduce:animate-none",
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
        "border-border bg-surface flex min-h-40 w-full flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border p-6 text-center",
        className,
      )}
    >
      <AlertTriangle className="text-warning size-6" aria-hidden />
      <p className="text-foreground font-semibold">{title}</p>
      {description ? <p className="text-muted max-w-sm text-sm">{description}</p> : null}
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-1">
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}

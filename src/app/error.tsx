"use client";

import * as React from "react";
import { ErrorState } from "@/components/ui/states";

/**
 * Route-level error boundary (App Router). Keeps the header/footer shell,
 * announces the error to assistive tech (role=alert inside ErrorState) and
 * offers a retry. Never exposes stack traces to visitors.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[route-error]", error);
    }
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-xl items-center justify-center px-5">
      <ErrorState
        title="Une erreur est survenue"
        description="La page n'a pas pu s'afficher. Vous pouvez réessayer — si le problème persiste, contactez-nous."
        onRetry={reset}
      />
    </div>
  );
}

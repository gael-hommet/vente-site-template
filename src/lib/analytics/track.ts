"use client";

import type { AnalyticsEventName, AnalyticsPayload } from "@/types";

/**
 * Analytics abstraction. A single `track()` that fans out to whichever provider
 * is configured via NEXT_PUBLIC_ANALYTICS_PROVIDER. NOTHING is enabled by
 * default: with no provider set, events go only to a local console logger in
 * development. No tracker IDs are invented; providers read their own env vars.
 *
 * Providers are invoked through their injected globals (window.gtag / plausible
 * / posthog / va), so no analytics package needs to be bundled unless you want
 * one (e.g. @vercel/analytics) — see docs/OPTIONAL-INTEGRATIONS.md.
 */

type Provider = "" | "vercel" | "posthog" | "plausible" | "ga";

interface AnalyticsGlobals {
  gtag?: (command: string, name: string, params?: Record<string, unknown>) => void;
  plausible?: (event: string, options?: { props?: Record<string, unknown> }) => void;
  posthog?: { capture?: (event: string, props?: Record<string, unknown>) => void };
  va?: (event: "event", props: Record<string, unknown>) => void;
}

function provider(): Provider {
  return (process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER ?? "") as Provider;
}

export function track(name: AnalyticsEventName, payload: AnalyticsPayload = {}): void {
  if (typeof window === "undefined") return;

  if (process.env.NODE_ENV !== "production") {
    console.debug(`%c[analytics] ${name}`, "color:#6d5cff", payload);
  }

  const w = window as unknown as AnalyticsGlobals;
  switch (provider()) {
    case "ga":
      w.gtag?.("event", name, payload);
      break;
    case "plausible":
      w.plausible?.(name, { props: payload });
      break;
    case "posthog":
      w.posthog?.capture?.(name, payload);
      break;
    case "vercel":
      w.va?.("event", { name, ...payload });
      break;
    default:
      // No provider configured: dev logger above is the only sink.
      break;
  }
}

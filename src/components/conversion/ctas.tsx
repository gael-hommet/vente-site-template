"use client";

import * as React from "react";
import { Phone, Navigation, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics/track";
import { cn } from "@/lib/utils";

/** Click-to-call button. Tracks phone_clicked. */
export function CallCTA({
  phone,
  label = "Appeler",
  variant = "brand",
  className,
}: {
  phone: string;
  label?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  className?: string;
}) {
  return (
    <Button asChild variant={variant} className={className}>
      <a href={`tel:${phone.replace(/\s/g, "")}`} onClick={() => track("phone_clicked", { phone })}>
        <Phone className="size-4" /> {label}
      </a>
    </Button>
  );
}

/** Directions button. Tracks directions_clicked. */
export function DirectionsCTA({
  lat,
  lng,
  query,
  label = "Itinéraire",
  variant = "outline",
  className,
}: {
  lat?: number;
  lng?: number;
  query?: string;
  label?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  className?: string;
}) {
  const href =
    lat != null && lng != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query ?? "")}`;
  return (
    <Button asChild variant={variant} className={className}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track("directions_clicked", {})}
      >
        <Navigation className="size-4" /> {label}
      </a>
    </Button>
  );
}

/**
 * Booking CTA. If NEXT_PUBLIC_CALCOM_LINK is set, links to Cal.com; otherwise it
 * falls back to an anchor to the on-page contact section. Tracks booking_started.
 */
export function BookingCTA({
  fallbackHref = "#contact",
  label = "Prendre rendez-vous",
  variant = "brand",
  className,
}: {
  fallbackHref?: string;
  label?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  className?: string;
}) {
  const cal = process.env.NEXT_PUBLIC_CALCOM_LINK;
  const href = cal || fallbackHref;
  const external = Boolean(cal);
  return (
    <Button asChild variant={variant} className={className}>
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        onClick={() => track("booking_started", { via: external ? "calcom" : "onpage" })}
      >
        <CalendarClock className="size-4" /> {label}
      </a>
    </Button>
  );
}

/**
 * StickyMobileCTA — persistent bottom action bar on mobile so the primary
 * conversion is always one tap away (never hidden behind a scene). Hidden on
 * desktop where inline CTAs suffice.
 */
export function StickyMobileCTA({
  phone,
  primaryLabel = "Devis gratuit",
  primaryHref = "#contact",
  className,
}: {
  phone?: string;
  primaryLabel?: string;
  primaryHref?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t border-border p-3 md:hidden",
        "glass",
        className,
      )}
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <Button asChild variant="brand" className="flex-1">
        <a href={primaryHref} onClick={() => track("cta_clicked", { cta: "sticky-primary" })}>
          {primaryLabel}
        </a>
      </Button>
      {phone && <CallCTA phone={phone} label="" variant="outline" className="px-4" />}
    </div>
  );
}

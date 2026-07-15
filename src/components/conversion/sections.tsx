import * as React from "react";
import { Star } from "lucide-react";
import { Card, GlassCard } from "@/components/ui/card";
import { Heading, Text } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Review card. Renders a VERIFIED review supplied by the client brief. This
 * component never fabricates content — pass only real, sourced reviews.
 */
export interface Review {
  author: string;
  text: string;
  rating?: number; // 1..5, only if genuinely provided
  source?: string;
}

export function ReviewCard({ review, className }: { review: Review; className?: string }) {
  return (
    <GlassCard className={cn("flex flex-col gap-3 p-6", className)}>
      {review.rating != null && (
        <div className="flex items-center gap-0.5" aria-label={`Note ${review.rating} sur 5`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                "size-4",
                i < review.rating! ? "fill-warning text-warning" : "text-border",
              )}
              aria-hidden
            />
          ))}
        </div>
      )}
      <blockquote className="text-foreground text-sm leading-relaxed">“{review.text}”</blockquote>
      <figcaption className="text-muted mt-auto text-xs">
        — {review.author}
        {review.source ? ` · ${review.source}` : ""}
      </figcaption>
    </GlassCard>
  );
}

/** A proof/stats strip. Values must be real and sourced. */
export interface ProofItem {
  value: string;
  label: string;
}

export function ProofSection({ items, className }: { items: ProofItem[]; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-2 gap-6 sm:grid-cols-4", className)}>
      {items.map((it, i) => (
        <div key={i} className="text-center">
          <dt className="sr-only">{it.label}</dt>
          <dd>
            <span className="text-brand block font-[family-name:var(--font-display)] text-3xl font-bold sm:text-4xl">
              {it.value}
            </span>
            <span className="text-muted mt-1 block text-sm">{it.label}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Offer/services cards. */
export interface Offer {
  title: string;
  description: string;
  price?: string; // only verified public prices
  badge?: string;
}

export function OfferSection({ offers, className }: { offers: Offer[]; className?: string }) {
  return (
    <div className={cn("grid gap-5 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {offers.map((offer, i) => (
        <Card key={i} className="flex flex-col gap-3 p-6">
          <div className="flex items-center justify-between gap-2">
            <Heading level="h4" as="h3">
              {offer.title}
            </Heading>
            {offer.badge && <Badge variant="brand">{offer.badge}</Badge>}
          </div>
          <Text tone="muted" size="sm">
            {offer.description}
          </Text>
          {offer.price && (
            <p className="text-foreground mt-auto text-lg font-semibold">{offer.price}</p>
          )}
        </Card>
      ))}
    </div>
  );
}

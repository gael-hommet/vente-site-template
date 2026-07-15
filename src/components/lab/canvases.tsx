"use client";

import { AdaptiveCanvas } from "@/components/three/AdaptiveCanvas";
import { LogoRevealScene } from "@/scenes/logo-reveal/LogoRevealScene";
import { ProductRevealScene } from "@/scenes/product-reveal/ProductRevealScene";

/** Logo-reveal demo canvas (metallic primitive + environment + postFX on ULTRA). */
export function LogoCanvas() {
  return (
    <AdaptiveCanvas
      className="border-border bg-surface-2 aspect-[16/10] w-full overflow-hidden rounded-[var(--radius-lg)] border"
      fallback={{ poster: "/assets/poster.svg", alt: "Rendu logo (fallback image)" }}
    >
      <LogoRevealScene />
    </AdaptiveCanvas>
  );
}

/** Product-reveal demo canvas (orbitable primitive + accessible hotspots). */
export function ProductCanvas() {
  return (
    <AdaptiveCanvas
      className="border-border bg-surface-2 aspect-[16/10] w-full overflow-hidden rounded-[var(--radius-lg)] border"
      fallback={{ poster: "/assets/poster.svg", alt: "Rendu produit (fallback image)" }}
    >
      <ProductRevealScene />
    </AdaptiveCanvas>
  );
}

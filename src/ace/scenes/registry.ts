import { createRegistry } from "@/ace/core";
import type { SceneDefinition } from "./contracts";

/**
 * The Scene Library. Today it names the three demo scenes; client scenes are
 * added here by the build process. Every entry satisfies the full contract
 * (fallback + alt, skippable, minTier) or it does not compile.
 */

const scenes: readonly SceneDefinition[] = [
  {
    id: "demo.logo-reveal",
    title: "Révélation de logo",
    description: "Primitive métallique + environnement + post-processing (ULTRA seulement).",
    engine: "webgl",
    minTier: "BALANCED",
    skippable: true,
    assets: ["/assets/poster.svg"],
    fallback: { poster: "/assets/poster.svg", alt: "Rendu logo (aperçu statique)" },
    load: () => import("@/scenes/logo-reveal/LogoRevealScene").then((m) => m.LogoRevealScene),
  },
  {
    id: "demo.product-reveal",
    title: "Révélation produit",
    description: "Produit orbitable avec hotspots accessibles au clavier.",
    engine: "webgl",
    minTier: "BALANCED",
    skippable: true,
    assets: ["/assets/poster.svg"],
    fallback: { poster: "/assets/poster.svg", alt: "Rendu produit (aperçu statique)" },
    load: () =>
      import("@/scenes/product-reveal/ProductRevealScene").then((m) => m.ProductRevealScene),
  },
  {
    id: "demo.vehicle-journey",
    title: "Trajet véhicule",
    description: "Caméra pilotée au scroll le long d'un trajet (ScrollTrigger scrub).",
    engine: "webgl",
    minTier: "BALANCED",
    skippable: true,
    assets: ["/assets/poster.svg"],
    fallback: { poster: "/assets/poster.svg", alt: "Trajet du véhicule (aperçu statique)" },
    load: () =>
      import("@/scenes/vehicle-journey/VehicleJourneyScene").then((m) => m.VehicleJourneyScene),
  },
];

const registry = createRegistry<SceneDefinition>("scenes", scenes);

export const SCENES = registry.list();
export const getScene = (id: string): SceneDefinition => registry.get(id);
export const hasScene = (id: string): boolean => registry.has(id);

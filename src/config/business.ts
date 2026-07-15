import type { BusinessConfig } from "@/types";
import { siteConfig } from "./site";

/**
 * SOURCE OF TRUTH for the client business. Everything SEO/JSON-LD/contact reads
 * from here. A real site fills this from input/CLIENT_BRIEF.md.
 *
 * ⚠️ VERIFIED FACTS ONLY. Never add invented reviews, ratings, prices, awards,
 * certifications or addresses. This default is an obvious placeholder for the
 * template's own demo shell — not a real business.
 */
export const businessConfig: BusinessConfig = {
  name: siteConfig.name,
  category: "LocalBusiness",
  description: siteConfig.description,
  url: siteConfig.url,
  // Contact / address / geo intentionally omitted until provided by a brief.
  // priceRange, sameAs, openingHours: added per client from verified sources.
};

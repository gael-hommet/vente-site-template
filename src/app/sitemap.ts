import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

/**
 * Sitemap. Add a route entry per public page a client site ships. The lab is
 * intentionally excluded from indexing (see robots.ts) — it's a technical demo.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: `${siteConfig.url}/`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}

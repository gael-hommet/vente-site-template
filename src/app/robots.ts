import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

/**
 * robots.txt. The technical laboratory (/lab) and API routes are disallowed
 * from indexing — they are demos/endpoints, not client content.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/lab", "/api/"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}

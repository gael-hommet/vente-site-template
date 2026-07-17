import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

/**
 * robots.txt. Internal engine pages (/lab, /ace-lab, /engine) and API routes
 * are disallowed from indexing — they are demos/tooling, not client content.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/lab", "/ace-lab", "/engine", "/api/"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}

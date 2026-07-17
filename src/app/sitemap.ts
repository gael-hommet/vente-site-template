import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

/**
 * Sitemap — the starter's public routes. Internal pages (/lab, /ace-lab,
 * /engine) and noindex pages (mentions légales) are intentionally excluded.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const route = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({
    url: `${siteConfig.url}${path}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority,
  });
  return [
    route("/", 1),
    route("/offre", 0.9),
    route("/realisations", 0.7),
    route("/a-propos", 0.6),
    route("/contact", 0.8),
  ];
}

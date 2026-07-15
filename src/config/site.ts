/**
 * Site-level configuration. Reads from public env with safe local defaults so
 * the template runs with zero configuration. A client site sets these in
 * `.env.local`.
 */

export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "Vente Site Engine",
  /** Absolute origin used for canonical URLs, OG, sitemap. No trailing slash. */
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  description:
    "Template de production pour générer des sites commerciaux premium, cinématiques, interactifs et performants.",
  locale: "fr_FR",
  /** Default social/OG image path (under /public). Replaced per client. */
  ogImage: "/assets/og-default.svg",
} as const;

export type SiteConfig = typeof siteConfig;

/**
 * ace-seo — façade over the SEO layer. Everything derives from
 * src/config/business.ts (single source of truth): metadata, JSON-LD,
 * sitemap/robots. JSON-LD must stay consistent with visible content — the
 * generators below only emit fields that business.ts actually provides.
 */

export { baseMetadata, buildMetadata, type PageMetaInput } from "@/lib/seo/metadata";
export { localBusinessJsonLd, websiteJsonLd, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo/jsonld";
export { businessConfig } from "@/config/business";
export { siteConfig, type SiteConfig } from "@/config/site";
export type { BusinessConfig, BusinessCategory } from "@/types";

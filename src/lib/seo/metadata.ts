import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

/**
 * SEO metadata system (Next Metadata API). `baseMetadata` sets sane site-wide
 * defaults (title template, canonical base, OG, Twitter, robots). `buildMetadata`
 * produces per-page metadata by overriding those defaults.
 *
 * HARD RULE: never inject invented facts (ratings, prices, awards). Titles and
 * descriptions must reflect only what the brief verifies.
 */
export const baseMetadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    siteName: siteConfig.name,
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    images: [{ url: siteConfig.ogImage, width: 1200, height: 630, alt: siteConfig.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export interface PageMetaInput {
  title?: string;
  description?: string;
  /** Path (e.g. "/services") → canonical + OG url. */
  path?: string;
  image?: string;
  noindex?: boolean;
}

export function buildMetadata(input: PageMetaInput = {}): Metadata {
  const { title, description, path = "/", image, noindex } = input;
  const url = new URL(path, siteConfig.url).toString();
  return {
    title,
    description: description ?? siteConfig.description,
    alternates: { canonical: path },
    openGraph: {
      ...baseMetadata.openGraph,
      url,
      title: title ?? siteConfig.name,
      description: description ?? siteConfig.description,
      ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      ...baseMetadata.twitter,
      title: title ?? siteConfig.name,
      description: description ?? siteConfig.description,
      ...(image ? { images: [image] } : {}),
    },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}

import type { BusinessConfig } from "@/types";
import { siteConfig } from "@/config/site";

/**
 * JSON-LD structured data generators. Every field is populated ONLY from
 * verified BusinessConfig data — undefined values are omitted, never guessed.
 * Do not add aggregateRating/review/award unless the brief provides sourced,
 * genuine data.
 */

type Json = Record<string, unknown>;

function compact(obj: Json): Json {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== ""),
  );
}

/** LocalBusiness (or sector subtype) structured data. */
export function localBusinessJsonLd(b: BusinessConfig): Json {
  return compact({
    "@context": "https://schema.org",
    "@type": b.category,
    name: b.name,
    legalName: b.legalName,
    description: b.description,
    url: b.url,
    telephone: b.telephone,
    email: b.email,
    priceRange: b.priceRange,
    address: b.address
      ? compact({
          "@type": "PostalAddress",
          streetAddress: b.address.streetAddress,
          addressLocality: b.address.addressLocality,
          addressRegion: b.address.addressRegion,
          postalCode: b.address.postalCode,
          addressCountry: b.address.addressCountry,
        })
      : undefined,
    geo: b.geo
      ? { "@type": "GeoCoordinates", latitude: b.geo.latitude, longitude: b.geo.longitude }
      : undefined,
    openingHoursSpecification: b.openingHours?.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.dayOfWeek,
      opens: h.opens,
      closes: h.closes,
    })),
    areaServed: b.areaServed,
    sameAs: b.sameAs,
  });
}

/** WebSite schema (enables sitelinks searchbox potential). */
export function websiteJsonLd(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
  };
}

/** BreadcrumbList from an ordered list of {name, path}. */
export function breadcrumbJsonLd(items: { name: string; path: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: new URL(it.path, siteConfig.url).toString(),
    })),
  };
}

/** FAQPage from verified Q/A pairs (mirror the on-page <FAQ>). */
export function faqJsonLd(items: { question: string; answer: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.question,
      acceptedAnswer: { "@type": "Answer", text: it.answer },
    })),
  };
}

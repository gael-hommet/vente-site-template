import { describe, it, expect } from "vitest";
import { buildMetadata, baseMetadata } from "@/lib/seo/metadata";
import { localBusinessJsonLd, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo/jsonld";
import { businessConfig } from "@/config/business";
import { siteConfig } from "@/config/site";
import type { BusinessConfig } from "@/types";

describe("baseMetadata", () => {
  it("defines a title template and default from the site config", () => {
    expect(baseMetadata.title).toEqual({
      default: siteConfig.name,
      template: `%s · ${siteConfig.name}`,
    });
  });

  it("sets a canonical alternate", () => {
    expect(baseMetadata.alternates?.canonical).toBe("/");
  });
});

describe("buildMetadata", () => {
  it("produces per-page title, description and canonical consistent with input", () => {
    const meta = buildMetadata({
      title: "Nos services",
      description: "Description de la page services.",
      path: "/services",
    });
    expect(meta.title).toBe("Nos services");
    expect(meta.description).toBe("Description de la page services.");
    expect(meta.alternates?.canonical).toBe("/services");
  });

  it("keeps the OpenGraph url absolute and aligned with the path", () => {
    const meta = buildMetadata({ title: "Contact", path: "/contact" });
    const og = meta.openGraph as { url?: string | URL; title?: string };
    expect(String(og.url)).toBe(`${siteConfig.url}/contact`);
    expect(og.title).toBe("Contact");
  });

  it("falls back to the site description when none is given", () => {
    const meta = buildMetadata({ title: "Accueil" });
    expect(meta.description).toBe(siteConfig.description);
  });

  it("emits noindex robots only when requested", () => {
    expect(buildMetadata({ title: "Public" }).robots).toBeUndefined();
    expect(buildMetadata({ title: "Preview", noindex: true }).robots).toEqual({
      index: false,
      follow: false,
    });
  });
});

describe("localBusinessJsonLd", () => {
  it("produces a valid LocalBusiness object from verified business config only", () => {
    const jsonLd = localBusinessJsonLd(businessConfig);
    expect(jsonLd["@context"]).toBe("https://schema.org");
    expect(jsonLd["@type"]).toBe(businessConfig.category);
    expect(jsonLd.name).toBe(businessConfig.name);
    expect(jsonLd.url).toBe(businessConfig.url);
    expect(jsonLd.description).toBe(businessConfig.description);
  });

  it("omits undefined/empty fields instead of inventing data", () => {
    const jsonLd = localBusinessJsonLd(businessConfig);
    // The default template config provides no telephone/address/rating.
    expect(jsonLd).not.toHaveProperty("telephone");
    expect(jsonLd).not.toHaveProperty("address");
    expect(jsonLd).not.toHaveProperty("aggregateRating");
    expect(jsonLd).not.toHaveProperty("priceRange");
  });

  it("nests a PostalAddress and geo when they are provided", () => {
    const withAddress: BusinessConfig = {
      ...businessConfig,
      telephone: "+33123456789",
      address: {
        streetAddress: "10 rue de Rivoli",
        addressLocality: "Paris",
        postalCode: "75001",
        addressCountry: "FR",
      },
      geo: { latitude: 48.8566, longitude: 2.3522 },
    };
    const jsonLd = localBusinessJsonLd(withAddress);
    expect(jsonLd.telephone).toBe("+33123456789");
    expect(jsonLd.address).toMatchObject({
      "@type": "PostalAddress",
      addressLocality: "Paris",
      postalCode: "75001",
    });
    expect(jsonLd.geo).toEqual({
      "@type": "GeoCoordinates",
      latitude: 48.8566,
      longitude: 2.3522,
    });
  });
});

describe("breadcrumbJsonLd", () => {
  it("numbers positions from 1 and builds absolute item URLs", () => {
    const jsonLd = breadcrumbJsonLd([
      { name: "Accueil", path: "/" },
      { name: "Services", path: "/services" },
    ]);
    expect(jsonLd["@type"]).toBe("BreadcrumbList");
    const items = jsonLd.itemListElement as { position: number; item: string }[];
    expect(items[0].position).toBe(1);
    expect(items[1].position).toBe(2);
    expect(items[1].item).toBe(`${siteConfig.url}/services`);
  });
});

describe("faqJsonLd", () => {
  it("mirrors verified Q/A pairs into a FAQPage", () => {
    const jsonLd = faqJsonLd([{ question: "Ouvert le dimanche ?", answer: "Non." }]);
    expect(jsonLd["@type"]).toBe("FAQPage");
    const entities = jsonLd.mainEntity as {
      "@type": string;
      name: string;
      acceptedAnswer: { text: string };
    }[];
    expect(entities[0]["@type"]).toBe("Question");
    expect(entities[0].name).toBe("Ouvert le dimanche ?");
    expect(entities[0].acceptedAnswer.text).toBe("Non.");
  });
});

import type { Metadata } from "next";
import { Section } from "@/components/ui/section";
import { Heading, Text } from "@/components/ui/typography";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { OfferSection } from "@/components/conversion/sections";
import { RevealGroup } from "@/components/motion/Reveal";
import { FAQ } from "@/components/conversion/FAQ";
import { starterContent } from "@/config/content";
import { renderText } from "@/ace/content";

export const metadata: Metadata = buildMetadata({
  title: "Offre",
  description: "Les formules et prestations — structure du starter ACE.",
  path: "/offre",
});

export default function OffrePage() {
  const c = starterContent;
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Accueil", path: "/" },
          { name: "Offre", path: "/offre" },
        ])}
      />
      <Section spacing="lg">
        <Heading level="h1">Notre offre</Heading>
        <Text tone="muted" className="mt-3 max-w-xl">
          Le détail des prestations du client : périmètre, déroulé, livrables. Les prix affichés
          sont exclusivement des prix publics vérifiés.
        </Text>
      </Section>
      <Section spacing="md" className="border-border border-t">
        <RevealGroup>
          <OfferSection
            offers={c.offers.map((o) => ({
              title: o.title,
              description: o.description,
              price: renderText(o.price),
            }))}
          />
        </RevealGroup>
      </Section>
      <Section spacing="md" className="border-border border-t">
        <Heading level="h2">Questions fréquentes</Heading>
        <FAQ
          className="mt-6 max-w-2xl"
          items={c.faq.map((f) => ({ question: f.question, answer: renderText(f.answer) }))}
        />
      </Section>
    </>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { ImageOff } from "lucide-react";
import { Section } from "@/components/ui/section";
import { Heading, Text } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";

export const metadata: Metadata = buildMetadata({
  title: "Réalisations",
  description: "Galerie des réalisations — vide tant qu'aucun projet client vérifié n'est fourni.",
  path: "/realisations",
});

/**
 * Portfolio page. Ships EMPTY on purpose: the engine never fabricates client
 * work. The empty state is a first-class, designed state — the gallery grid
 * appears when input/assets provides real, rights-cleared projects.
 */
export default function RealisationsPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Accueil", path: "/" },
          { name: "Réalisations", path: "/realisations" },
        ])}
      />
      <Section spacing="lg">
        <Heading level="h1">Réalisations</Heading>
        <Text tone="muted" className="mt-3 max-w-xl">
          Chaque projet présenté ici est un travail réel du client, avec des visuels dont les droits
          sont vérifiés.
        </Text>
      </Section>
      <Section spacing="md" className="border-border border-t">
        <div className="border-border bg-surface flex min-h-72 flex-col items-center justify-center gap-4 rounded-[var(--radius-xl)] border border-dashed p-10 text-center">
          <ImageOff className="text-muted size-8" aria-hidden />
          <div>
            <p className="text-foreground font-semibold">Aucune réalisation pour le moment</p>
            <p className="text-muted mx-auto mt-1 max-w-sm text-sm">
              La galerie se remplit avec les projets fournis dans le brief (photos, avant/après,
              vidéos). Le moteur n&apos;invente jamais de réalisations.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/contact">Discuter d&apos;un projet</Link>
          </Button>
        </div>
      </Section>
    </>
  );
}

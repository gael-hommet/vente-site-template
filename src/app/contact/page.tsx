import type { Metadata } from "next";
import { Section } from "@/components/ui/section";
import { Heading, Text } from "@/components/ui/typography";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { MapPin } from "lucide-react";
import { ContactForm } from "@/components/conversion/ContactForm";
import { businessConfig } from "@/config/business";

export const metadata: Metadata = buildMetadata({
  title: "Contact",
  description: "Formulaire de contact et coordonnées — starter ACE (envoi local simulé en dev).",
  path: "/contact",
});

/**
 * Contact page. The form validates with the shared zod schema and posts to the
 * local simulated endpoint (adapters stay env-gated). The map renders the
 * static MapFallback until business.ts provides verified coordinates — the
 * address block itself explains what is missing instead of inventing one.
 */
export default function ContactPage() {
  const hasGeo = Boolean(businessConfig.geo);
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Accueil", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />
      <Section spacing="lg">
        <Heading level="h1">Contact</Heading>
        <Text tone="muted" className="mt-3 max-w-xl">
          Réponse rapide, sans engagement. En développement, l&apos;envoi est simulé localement :
          rien ne quitte la machine.
        </Text>
      </Section>
      <Section spacing="md" className="border-border border-t">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <h2 className="sr-only">Formulaire de contact</h2>
            <ContactForm />
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold">Nous trouver</h2>
            {hasGeo ? null : (
              <div className="border-border bg-surface-2 flex min-h-56 flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-dashed p-6 text-center">
                <MapPin className="text-muted size-6" aria-hidden />
                <p className="text-foreground font-medium">Adresse [À CONFIRMER]</p>
                <p className="text-muted max-w-xs text-sm">
                  L&apos;adresse et l&apos;itinéraire apparaissent dès que le brief fournit des
                  coordonnées vérifiées.
                </p>
              </div>
            )}
            <Text size="sm" tone="muted">
              La carte interactive (MapLibre) s&apos;active dès que des coordonnées vérifiées sont
              renseignées dans <code>business.ts</code> ; le repli statique reste disponible sans
              WebGL.
            </Text>
          </div>
        </div>
      </Section>
    </>
  );
}

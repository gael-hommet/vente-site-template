import type { Metadata } from "next";
import { Section } from "@/components/ui/section";
import { Heading, Text } from "@/components/ui/typography";
import { buildMetadata } from "@/lib/seo/metadata";
import { ToConfirmValue } from "@/components/starter/ToConfirmValue";
import { starterContent } from "@/config/content";

export const metadata: Metadata = buildMetadata({
  title: "Mentions légales",
  description: "Mentions légales du site.",
  path: "/mentions-legales",
  noindex: true,
});

/** Legal skeleton — every field is a fact and ships [À CONFIRMER]. */
export default function MentionsLegalesPage() {
  const l = starterContent.legal;
  const rows: { label: string; value: (typeof l)[keyof typeof l] }[] = [
    { label: "Éditeur du site", value: l.entity },
    { label: "SIRET", value: l.siret },
    { label: "Siège social", value: l.address },
    { label: "Responsable de publication", value: l.publisher },
    { label: "Hébergeur", value: l.host },
  ];
  return (
    <Section spacing="lg">
      <Heading level="h1">Mentions légales</Heading>
      <Text tone="muted" className="mt-3 max-w-xl">
        Ces informations sont obligatoires et proviennent exclusivement du client. Le site ne doit
        pas être mis en production tant qu&apos;un champ reste à confirmer.
      </Text>
      <dl className="border-border bg-surface mt-8 max-w-2xl divide-y rounded-[var(--radius-lg)] border">
        {rows.map((row) => (
          <div key={row.label} className="grid gap-1 p-4 sm:grid-cols-[220px_1fr] sm:gap-4">
            <dt className="text-muted text-sm">{row.label}</dt>
            <dd className="font-medium">
              <ToConfirmValue value={row.value} />
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

import type { Metadata } from "next";
import { Section } from "@/components/ui/section";
import { Heading, Text } from "@/components/ui/typography";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { Reveal } from "@/components/motion/Reveal";
import { ToConfirmValue } from "@/components/starter/ToConfirmValue";
import { starterContent } from "@/config/content";

export const metadata: Metadata = buildMetadata({
  title: "À propos",
  description: "L'histoire, l'équipe et les valeurs — structure du starter ACE.",
  path: "/a-propos",
});

export default function AProposPage() {
  const c = starterContent.about;
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Accueil", path: "/" },
          { name: "À propos", path: "/a-propos" },
        ])}
      />
      <Section spacing="lg">
        <Heading level="h1">{c.title}</Heading>
        <div className="mt-6 grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div className="flex max-w-xl flex-col gap-4">
            {c.paragraphs.map((p, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <Text tone="muted">{p}</Text>
              </Reveal>
            ))}
          </div>
          <dl className="border-border bg-surface h-fit divide-y rounded-[var(--radius-lg)] border">
            <div className="flex items-center justify-between gap-4 p-4">
              <dt className="text-muted text-sm">Création</dt>
              <dd className="font-medium">
                <ToConfirmValue value={c.founded} />
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 p-4">
              <dt className="text-muted text-sm">Équipe</dt>
              <dd className="font-medium">
                <ToConfirmValue value={c.team} />
              </dd>
            </div>
          </dl>
        </div>
      </Section>
    </>
  );
}

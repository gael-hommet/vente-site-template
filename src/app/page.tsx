import Link from "next/link";
import type { Metadata } from "next";
import { Section } from "@/components/ui/section";
import { Heading, Text } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { buildMetadata } from "@/lib/seo/metadata";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { SplitTextFallback } from "@/components/motion/SplitTextFallback";
import { ScrollProgress } from "@/components/motion/ScrollProgress";
import { OfferSection } from "@/components/conversion/sections";
import { FAQ } from "@/components/conversion/FAQ";
import { HeroScene } from "@/components/starter/HeroScene";
import { ToConfirmValue } from "@/components/starter/ToConfirmValue";
import { starterContent } from "@/config/content";
import { renderText } from "@/ace/content";

export const metadata: Metadata = buildMetadata({
  title: "Accueil",
  description:
    "Starter ACE — structure d'un site premium : narration, preuve, offre et conversion.",
  path: "/",
});

/**
 * Starter home. Neutral by design: it demonstrates the engine's narrative
 * structure (hero → proof → offer → FAQ → conversion) with the real ACE
 * modules, while every FACT stays visibly [À CONFIRMER] until a verified
 * client brief fills src/config/content.ts.
 */
export default function HomePage() {
  const c = starterContent;
  return (
    <>
      <ScrollProgress />

      <Section spacing="lg">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div className="flex flex-col items-start gap-6">
            <Reveal>
              <Badge variant="brand">{c.hero.kicker}</Badge>
            </Reveal>
            <Heading level="display" as="h1">
              <SplitTextFallback text={c.hero.title} />
            </Heading>
            <Reveal delay={0.15}>
              <Text size="lg" tone="muted" className="max-w-xl">
                {c.hero.subtitle}
              </Text>
            </Reveal>
            <Reveal delay={0.25}>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href={c.hero.primaryCta.href}>{c.hero.primaryCta.label}</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href={c.hero.secondaryCta.href}>{c.hero.secondaryCta.label}</Link>
                </Button>
              </div>
            </Reveal>
          </div>
          <Reveal delay={0.2}>
            <HeroScene />
          </Reveal>
        </div>
      </Section>

      <Section spacing="md" className="border-border border-t">
        <h2 className="sr-only">Preuves et chiffres clés</h2>
        <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {c.proof.items.map((item) => (
            <div key={item.label} className="text-center">
              <dt className="text-muted order-2 mt-1 block text-sm">{item.label}</dt>
              <dd className="font-[family-name:var(--font-display)] text-2xl font-bold sm:text-3xl">
                <ToConfirmValue value={item.value} />
              </dd>
            </div>
          ))}
        </dl>
        <Text size="sm" tone="muted" className="mt-6 text-center">
          Chaque chiffre de cette bande provient du brief client vérifié — jamais du moteur.
        </Text>
      </Section>

      <Section spacing="md" className="border-border border-t">
        <div className="mb-8 flex flex-col gap-2">
          <Heading level="h2">Une offre lisible</Heading>
          <Text tone="muted" className="max-w-xl">
            Trois formules maximum au-dessus de la ligne de flottaison : le visiteur comprend en dix
            secondes ce que le client vend.
          </Text>
        </div>
        <RevealGroup>
          <OfferSection
            offers={c.offers.map((o) => ({
              title: o.title,
              description: o.description,
              price: renderText(o.price),
            }))}
          />
        </RevealGroup>
        <div className="mt-8">
          <Button asChild variant="outline">
            <Link href="/offre">Voir le détail de l&apos;offre</Link>
          </Button>
        </div>
      </Section>

      <Section spacing="md" className="border-border border-t">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <Heading level="h2">Questions fréquentes</Heading>
            <Text tone="muted" className="mt-2 max-w-md">
              Les réponses viennent du client. Le JSON-LD FAQPage n&apos;est émis qu&apos;une fois
              les réponses vérifiées.
            </Text>
          </div>
          <FAQ
            items={c.faq.map((f) => ({
              question: f.question,
              answer: renderText(f.answer),
            }))}
          />
        </div>
      </Section>

      <Section id="contact" spacing="lg" className="border-border border-t">
        <div className="bg-surface-2 flex flex-col items-center gap-5 rounded-[var(--radius-2xl)] px-6 py-14 text-center">
          <Heading level="h2">Prêt à en parler ?</Heading>
          <Text tone="muted" className="max-w-md">
            Le point de conversion reste atteignable depuis chaque section, sans terminer une scène
            ni une animation.
          </Text>
          <Button asChild size="lg">
            <Link href="/contact">{c.hero.primaryCta.label}</Link>
          </Button>
        </div>
      </Section>
    </>
  );
}

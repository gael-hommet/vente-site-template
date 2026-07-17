import Link from "next/link";
import type { Metadata } from "next";
import { Section } from "@/components/ui/section";
import { Heading, Text } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EngineStatus } from "@/components/EngineStatus";

export const metadata: Metadata = {
  title: "Moteur — tableau de bord",
  description: "État du moteur ACE et modules disponibles (page interne).",
  robots: { index: false, follow: false },
};

const COMMANDS: { cmd: string; desc: string }[] = [
  { cmd: "/build-site", desc: "Recherche, conçoit, code et teste le site à partir du brief." },
  { cmd: "/preview-site", desc: "Lance le serveur et ouvre la preview dans Codespaces." },
  { cmd: "/audit-site", desc: "Audit conversion, design, responsive, SEO, a11y, perf." },
  { cmd: "/finalize-site", desc: "Nettoie, optimise, teste, build production (sans déployer)." },
  { cmd: "/ingest-assets", desc: "Analyse et optimise les fichiers d'input/assets/." },
];

const MODULES: { group: string; items: string[] }[] = [
  {
    group: "Design system",
    items: ["Button", "GlassButton", "Card", "Dialog", "Drawer", "Form fields"],
  },
  {
    group: "Motion",
    items: ["Reveal", "Parallax", "MagneticButton", "SplitText", "ScrollProgress"],
  },
  {
    group: "Cinématique (GSAP)",
    items: ["PinnedSequence", "ScrollScene", "ChapterTimeline", "Lenis"],
  },
  {
    group: "3D (R3F)",
    items: ["AdaptiveCanvas", "ScrollCamera", "Stages", "Hotspot", "PostFX", "Fallback"],
  },
  { group: "Vidéo contrôlée", items: ["ImageSequence", "ScrollVideo", "MediaFallback"] },
  {
    group: "Photo / 2.5D",
    items: ["LayeredPhoto", "BeforeAfter", "KenBurns", "Gallery", "Panorama"],
  },
  { group: "Carte", items: ["BusinessMap", "SceneToMapTransition", "MapFallback"] },
  { group: "Conversion", items: ["LeadForm", "CTA", "Proof", "Offer", "FAQ", "Footer"] },
  { group: "SEO / Analytics", items: ["Metadata", "JSON-LD", "sitemap", "robots", "events"] },
];

export default function EnginePage() {
  return (
    <>
      <Section spacing="lg">
        <div className="grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div className="flex flex-col items-start gap-6">
            <Badge variant="neutral">Moteur technique · usage interne</Badge>
            <Heading level="display" as="h1">
              Aurexia Cinematic Engine
              <span className="text-brand mt-2 block">Tableau de bord</span>
            </Heading>
            <Text size="lg" tone="muted" className="max-w-xl">
              L&apos;usine à sites commerciaux premium, cinématiques, 3D, performants, accessibles
              et optimisés pour convertir. Cette page n&apos;apparaît jamais sur un site client
              livré.
            </Text>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/ace-lab">ACE Lab</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/lab">Laboratoire de démos</Link>
              </Button>
            </div>
          </div>
          <EngineStatus />
        </div>
      </Section>

      <Section id="commands" spacing="md">
        <Heading level="h2">Commandes principales</Heading>
        <Text tone="muted" className="mt-2">
          À exécuter dans Claude Code depuis un Codespace issu de ce template.
        </Text>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {COMMANDS.map((c) => (
            <li key={c.cmd}>
              <Card className="flex flex-col gap-1 p-5">
                <code className="text-brand-strong font-[family-name:var(--font-mono)] text-sm font-semibold">
                  {c.cmd}
                </code>
                <span className="text-muted text-sm">{c.desc}</span>
              </Card>
            </li>
          ))}
        </ul>
      </Section>

      <Section spacing="md">
        <Heading level="h2">Modules disponibles</Heading>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => (
            <Card key={m.group} className="p-5">
              <p className="mb-2 text-sm font-semibold">{m.group}</p>
              <div className="flex flex-wrap gap-1.5">
                {m.items.map((it) => (
                  <span
                    key={it}
                    className="bg-surface-2 text-muted rounded-full px-2.5 py-1 text-xs"
                  >
                    {it}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </Section>
    </>
  );
}

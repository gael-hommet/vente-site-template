import type { Metadata } from "next";
import Link from "next/link";
import { ACE_NAME, ACE_VERSION, ACE_MODULES } from "@/ace/core";
import { MOTION_RECIPES } from "@/ace/motion/registry";
import { SCENES } from "@/ace/scenes/registry";
import { QUALITY_BUDGETS } from "@/lib/performance/quality";
import { PresetPreview } from "@/components/ace-lab/PresetPreview";
import { TokensContrast } from "@/components/ace-lab/TokensContrast";
import { MotionPlayground } from "@/components/ace-lab/MotionPlayground";
import { SceneStudio } from "@/components/ace-lab/SceneStudio";
import { ConversionShowcase } from "@/components/ace-lab/ConversionShowcase";
import { RecipeMatrix } from "@/components/ace-lab/RecipeMatrix";

export const metadata: Metadata = {
  title: "ACE Lab",
  description:
    "Laboratoire interne du moteur ACE : registres, tokens, motion, scènes, recipes, états.",
  robots: { index: false, follow: false },
};

/**
 * ACE Lab — the engine's internal laboratory. Server part: the live registries
 * and contracts (zero client JS). Client part: isolated interactive demos
 * (presets, contrast meter, motion playground, scene studio, conversion).
 * Never shipped on a client production site (noindex + excluded by the
 * generator's checklist).
 */
export default function AceLabPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <header className="mb-10">
        <p className="text-muted font-mono text-sm">
          {ACE_NAME} · v{ACE_VERSION}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">ACE Lab</h1>
        <p className="text-muted mt-2 max-w-2xl">
          Validation interne du moteur : modules, Design Language, recipes, Motion Library, Scene
          Library et budgets de performance — lus depuis les registres réels.
        </p>
      </header>

      <section aria-labelledby="ace-modules" className="mb-12">
        <h2 id="ace-modules" className="mb-4 text-xl font-semibold">
          Modules du moteur
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {Object.entries(ACE_MODULES).map(([id, role]) => (
            <li key={id} className="border-border bg-surface rounded-[var(--radius-md)] border p-4">
              <p className="font-mono text-sm font-medium">{id}</p>
              <p className="text-muted mt-1 text-sm">{role}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="ace-design" className="mb-12">
        <h2 id="ace-design" className="mb-4 text-xl font-semibold">
          Design Language — presets (live)
        </h2>
        <PresetPreview />
      </section>

      <section aria-labelledby="ace-tokens" className="mb-12">
        <h2 id="ace-tokens" className="mb-4 text-xl font-semibold">
          Tokens & contrastes mesurés
        </h2>
        <p className="text-muted mb-4 max-w-2xl text-sm">
          Ratios WCAG calculés sur les couleurs réellement résolues par le navigateur (preset et
          thème inclus) — remesurés au changement de thème.
        </p>
        <TokensContrast />
      </section>

      <section aria-labelledby="ace-recipes" className="mb-12">
        <h2 id="ace-recipes" className="mb-4 text-xl font-semibold">
          Matrice recipes × Design Language
        </h2>
        <p className="text-muted mb-4 max-w-2xl text-sm">
          Compare une même famille de recipes sous un Design Language donné (contenu neutre,
          identique pour toutes) — vérifie que la variation est structurelle, pas seulement une
          teinte, et que chaque recipe d&apos;une famille est visuellement distincte des autres.
        </p>
        <RecipeMatrix />
      </section>

      <section aria-labelledby="ace-motion" className="mb-12">
        <h2 id="ace-motion" className="mb-4 text-xl font-semibold">
          Motion Library ({MOTION_RECIPES.length})
        </h2>
        <div className="border-border overflow-x-auto rounded-[var(--radius-md)] border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2">
              <tr>
                <th className="px-3 py-2 font-medium">Id</th>
                <th className="px-3 py-2 font-medium">Moteur</th>
                <th className="px-3 py-2 font-medium">Intention</th>
                <th className="px-3 py-2 font-medium">Reduced motion</th>
                <th className="px-3 py-2 font-medium">Passable</th>
              </tr>
            </thead>
            <tbody>
              {MOTION_RECIPES.map((recipe) => (
                <tr key={recipe.id} className="border-border border-t">
                  <td className="px-3 py-2 font-mono">{recipe.id}</td>
                  <td className="px-3 py-2">{recipe.engine}</td>
                  <td className="px-3 py-2">{recipe.intent}</td>
                  <td className="px-3 py-2">{recipe.reducedMotion}</td>
                  <td className="px-3 py-2">
                    {recipe.intent === "cinematic" ? (recipe.skippable ? "oui" : "—") : "n/a"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6">
          <h3 className="mb-4 font-semibold">Aire de jeu motion</h3>
          <MotionPlayground />
        </div>
      </section>

      <section aria-labelledby="ace-scenes" className="mb-12">
        <h2 id="ace-scenes" className="mb-4 text-xl font-semibold">
          Scene Library ({SCENES.length})
        </h2>
        <div className="border-border overflow-x-auto rounded-[var(--radius-md)] border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2">
              <tr>
                <th className="px-3 py-2 font-medium">Id</th>
                <th className="px-3 py-2 font-medium">Moteur</th>
                <th className="px-3 py-2 font-medium">Tier minimum</th>
                <th className="px-3 py-2 font-medium">Fallback (alt)</th>
                <th className="px-3 py-2 font-medium">Passable</th>
              </tr>
            </thead>
            <tbody>
              {SCENES.map((scene) => (
                <tr key={scene.id} className="border-border border-t">
                  <td className="px-3 py-2 font-mono">{scene.id}</td>
                  <td className="px-3 py-2">{scene.engine}</td>
                  <td className="px-3 py-2">{scene.minTier}</td>
                  <td className="px-3 py-2">{scene.fallback.alt}</td>
                  <td className="px-3 py-2">{scene.skippable ? "oui" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6">
          <h3 className="mb-4 font-semibold">Scene Studio — tiers, fallback, perte de contexte</h3>
          <SceneStudio />
        </div>
      </section>

      <section aria-labelledby="ace-media" className="mb-12">
        <h2 id="ace-media" className="mb-4 text-xl font-semibold">
          Médias adaptatifs
        </h2>
        <p className="text-muted max-w-2xl text-sm">
          Les démos scrub (séquence d&apos;images, vidéo contrôlée, carte cinématique) tournent sur{" "}
          <Link href="/lab" className="text-brand-strong underline">
            /lab
          </Link>{" "}
          — elles exigent de longues plages de scroll épinglées. Les contrats médias (dimensions,
          poster et alt obligatoires, sous-titres si voix) sont validés par <code>ace-media</code>{" "}
          et testés unitairement.
        </p>
      </section>

      <section aria-labelledby="ace-conversion-title" className="mb-12" id="ace-conversion">
        <h2 id="ace-conversion-title" className="mb-4 text-xl font-semibold">
          Conversion & états UI
        </h2>
        <ConversionShowcase />
      </section>

      <section aria-labelledby="ace-native" className="mb-12">
        <h2 id="ace-native" className="mb-4 text-xl font-semibold">
          Choix natifs assumés
        </h2>
        <ul className="text-muted grid gap-2 text-sm sm:grid-cols-3">
          <li className="border-border rounded-[var(--radius-md)] border p-4">
            <span className="text-foreground font-medium">Transitions de page</span> — navigation
            App Router native ; une transition cinématique sera une décision de DA par site, pas un
            défaut moteur.
          </li>
          <li className="border-border rounded-[var(--radius-md)] border p-4">
            <span className="text-foreground font-medium">Curseur</span> — curseur système par
            défaut (accessibilité, latence) ; un curseur custom éventuel restera optionnel et
            désactivé au clavier/touch.
          </li>
          <li className="border-border rounded-[var(--radius-md)] border p-4">
            <span className="text-foreground font-medium">Défilement natif</span> — Lenis ne capture
            jamais les parcours clavier/ancres ; reduced-motion le coupe entièrement.
          </li>
        </ul>
      </section>

      <section aria-labelledby="ace-budgets">
        <h2 id="ace-budgets" className="mb-4 text-xl font-semibold">
          Budgets de performance par tier
        </h2>
        <div className="border-border overflow-x-auto rounded-[var(--radius-md)] border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2">
              <tr>
                <th className="px-3 py-2 font-medium">Tier</th>
                <th className="px-3 py-2 font-medium">DPR</th>
                <th className="px-3 py-2 font-medium">Antialias</th>
                <th className="px-3 py-2 font-medium">Ombres</th>
                <th className="px-3 py-2 font-medium">PostFX</th>
                <th className="px-3 py-2 font-medium">Texture max</th>
                <th className="px-3 py-2 font-medium">FPS cible</th>
              </tr>
            </thead>
            <tbody>
              {(Object.keys(QUALITY_BUDGETS) as Array<keyof typeof QUALITY_BUDGETS>).map((tier) => {
                const budget = QUALITY_BUDGETS[tier];
                return (
                  <tr key={tier} className="border-border border-t">
                    <td className="px-3 py-2 font-mono">{tier}</td>
                    <td className="px-3 py-2">
                      {budget.dpr[0]}–{budget.dpr[1]}
                    </td>
                    <td className="px-3 py-2">{budget.antialias ? "oui" : "non"}</td>
                    <td className="px-3 py-2">{budget.shadows ? "oui" : "non"}</td>
                    <td className="px-3 py-2">{budget.postprocessing ? "oui" : "non"}</td>
                    <td className="px-3 py-2">{budget.maxTextureSize}px</td>
                    <td className="px-3 py-2">{budget.targetFps}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import { ACE_NAME, ACE_VERSION, ACE_MODULES } from "@/ace/core";
import { DESIGN_PRESETS } from "@/ace/config";
import { MOTION_RECIPES } from "@/ace/motion/registry";
import { SCENES } from "@/ace/scenes/registry";
import { QUALITY_BUDGETS } from "@/lib/performance/quality";

export const metadata: Metadata = {
  title: "ACE Lab",
  description: "Page interne de validation du moteur ACE : contrats, registres, presets.",
  robots: { index: false, follow: false },
};

/**
 * ACE Lab — internal engine-validation surface. Everything here is read
 * directly from the live registries: if a contract or an id changes, this page
 * changes with it. Server-rendered, zero client JS, zero WebGL.
 */
export default function AceLabPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
      <header className="mb-10">
        <p className="text-muted font-mono text-sm">
          {ACE_NAME} · v{ACE_VERSION}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">ACE Lab</h1>
        <p className="text-muted mt-2 max-w-2xl">
          Validation interne du moteur : modules, Design Language, Motion Library, Scene Library et
          budgets de performance — lus depuis les registres réels.
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
          Design Language — presets
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {DESIGN_PRESETS.map((preset) => (
            <article
              key={preset.id}
              className="border-border bg-surface rounded-[var(--radius-lg)] border p-4"
            >
              <div className="flex items-center gap-2">
                {[preset.light.brand, preset.light.brandStrong, preset.dark.brand].map(
                  (color, i) => (
                    <span
                      key={i}
                      aria-hidden
                      className="border-border inline-block size-6 rounded-full border"
                      style={{ background: color }}
                    />
                  ),
                )}
              </div>
              <h3 className="mt-3 font-semibold">
                {preset.title} <span className="text-muted font-mono text-xs">({preset.id})</span>
              </h3>
              <p className="text-muted mt-1 text-sm">{preset.description}</p>
              <p className="text-muted mt-2 text-xs">
                Mouvement : <span className="font-medium">{preset.motionCharacter}</span>
              </p>
            </article>
          ))}
        </div>
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
        <p className="text-muted mt-2 text-sm">
          Le rendu interactif des scènes reste sur la page <code>/lab</code> ; ici seule la
          conformité des contrats est exposée (aucun WebGL monté).
        </p>
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

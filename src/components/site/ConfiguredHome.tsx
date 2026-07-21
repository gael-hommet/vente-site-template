import { Section } from "@/components/ui/section";
import { Heading, Text } from "@/components/ui/typography";
import { ScrollProgress } from "@/components/motion/ScrollProgress";
import { SceneBand } from "@/components/site/SceneBand";
import {
  getHeroRecipe,
  hasHeroRecipe,
  getProjectsRecipe,
  hasProjectsRecipe,
  getStorytellingRecipe,
  hasStorytellingRecipe,
  getConversionRecipe,
  hasConversionRecipe,
} from "@/ace/recipes";
import { layoutMainClass } from "@/ace/recipes/layouts";
import { resolvedClient } from "@/config/client.resolved";
import { resolvedFeatures } from "@/config/features.generated";
import { siteContent } from "@/config/site-content";
import { businessConfig } from "@/config/business";

/**
 * Home CONFIG-DRIVEN : monte les recipes sélectionnées (`client.resolved.ts`)
 * avec le contenu (`site-content.ts`) et le Design Language actif. Deux
 * configurations différentes produisent un DOM structurellement différent —
 * c'est ce qui rend la sélection de recipes réellement observable (validation
 * anti-template).
 *
 * Toutes les recettes s'habillent via les tokens (var(--brand)…), donc aucune
 * identité n'est codée en dur ici. Le contenu reste factuellement neutre tant
 * qu'un brief vérifié ne l'a pas rempli.
 */
/**
 * Résout un id de recipe avec repli : le générateur valide déjà les ids
 * (validateRecipeSelection) donc un id inconnu ne peut venir que d'une édition
 * manuelle de client.resolved.ts. On avertit alors (dev) pour rendre la faute
 * visible plutôt que de la masquer silencieusement.
 */
function resolveRecipeId(id: string, has: (id: string) => boolean, fallback: string): string {
  if (has(id)) return id;
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      `[ACE] recipe inconnue "${id}" dans client.resolved.ts — repli sur "${fallback}". Corrigez l'id.`,
    );
  }
  return fallback;
}

export function ConfiguredHome() {
  const { recipes } = resolvedClient;

  const Hero = getHeroRecipe(resolveRecipeId(recipes.hero, hasHeroRecipe, "typographic")).Component;
  const Story = getStorytellingRecipe(
    resolveRecipeId(recipes.storytelling, hasStorytellingRecipe, "linear-sections"),
  ).Component;
  const Projects = getProjectsRecipe(
    resolveRecipeId(recipes.projects, hasProjectsRecipe, "visual-grid"),
  ).Component;
  const Conversion = getConversionRecipe(
    resolveRecipeId(recipes.conversion, hasConversionRecipe, "minimal-contact"),
  ).Component;

  // La recipe de layout est RÉELLEMENT appliquée : son traitement de conteneur
  // (largeur, padding, rythme des sections) enveloppe le corps de page → deux
  // layouts différents rendent un DOM différent (data-layout observable).
  const layoutId = recipes.layout || "editorial-layout";
  const layoutClass = layoutMainClass(layoutId);

  const c = siteContent;
  const showCollection = resolvedFeatures.collections && c.collection.items.length > 0;

  return (
    <>
      <ScrollProgress />

      {/* Hero + scène : pleine largeur (gèrent leurs propres marges). */}
      <Hero
        eyebrow={c.hero.eyebrow}
        title={c.hero.title}
        subtitle={c.hero.subtitle}
        primaryCta={c.hero.primaryCta}
        secondaryCta={c.hero.secondaryCta}
        media={c.hero.media ?? null}
      />

      {/* Scène WebGL — montée seulement si features.webgl (dérivé de
          webglIntensity). SceneBand charge HeroScene via next/dynamic : sur un
          site sans WebGL (features.webgl=false), cette branche n'est jamais
          rendue et le chunk three.js n'est jamais téléchargé. AdaptiveCanvas
          gère ensuite fallback/tier : LITE et SSR n'affichent que le poster. */}
      {resolvedFeatures.webgl && c.hero.sceneId ? (
        <Section spacing="md" aria-label="Démonstration interactive">
          <SceneBand sceneId={c.hero.sceneId} />
        </Section>
      ) : null}

      {/* Corps de page enveloppé par le traitement de la recipe de layout.
          Le rythme vertical suit --section-space (token de DENSITÉ du Design
          Language : spacious 7rem vs compact 5rem) → la densité devient
          observable, pas seulement déclarée. */}
      <div
        data-layout={layoutId}
        className={`${layoutClass} [&>section]:py-[var(--section-space)]`}
      >
        <Section id="story" spacing="lg" contained={false} className="border-border border-t">
          <div className="mb-8 flex max-w-2xl flex-col gap-2">
            <Heading level="h2">{c.story.heading}</Heading>
            {c.story.intro ? <Text tone="muted">{c.story.intro}</Text> : null}
          </div>
          <Story chapters={c.story.chapters} />
        </Section>

        {showCollection ? (
          <Section
            id="collection"
            spacing="lg"
            contained={false}
            className="border-border border-t"
          >
            <div className="mb-8 flex max-w-2xl flex-col gap-2">
              <Heading level="h2">{c.collection.heading}</Heading>
              {c.collection.intro ? <Text tone="muted">{c.collection.intro}</Text> : null}
            </div>
            <Projects items={c.collection.items} />
          </Section>
        ) : null}

        <Section id="contact" spacing="lg" contained={false} className="border-border border-t">
          <Conversion
            title={c.conversion.title}
            description={c.conversion.description}
            primaryCta={c.conversion.primaryCta}
            phone={businessConfig.telephone}
          />
        </Section>
      </div>
    </>
  );
}

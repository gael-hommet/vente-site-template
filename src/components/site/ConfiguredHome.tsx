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
export function ConfiguredHome() {
  const { recipes } = resolvedClient;

  const heroId = hasHeroRecipe(recipes.hero) ? recipes.hero : "typographic";
  const Hero = getHeroRecipe(heroId).Component;

  const storyId = hasStorytellingRecipe(recipes.storytelling)
    ? recipes.storytelling
    : "linear-sections";
  const Story = getStorytellingRecipe(storyId).Component;

  const projectsId = hasProjectsRecipe(recipes.projects) ? recipes.projects : "visual-grid";
  const Projects = getProjectsRecipe(projectsId).Component;

  const conversionId = hasConversionRecipe(recipes.conversion)
    ? recipes.conversion
    : "minimal-contact";
  const Conversion = getConversionRecipe(conversionId).Component;

  const c = siteContent;
  const showCollection = resolvedFeatures.collections && c.collection.items.length > 0;

  return (
    <>
      <ScrollProgress />

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

      <Section id="story" spacing="lg" className="border-border border-t">
        <div className="mb-8 flex max-w-2xl flex-col gap-2">
          <Heading level="h2">{c.story.heading}</Heading>
          {c.story.intro ? <Text tone="muted">{c.story.intro}</Text> : null}
        </div>
        <Story chapters={c.story.chapters} />
      </Section>

      {showCollection ? (
        <Section id="collection" spacing="lg" className="border-border border-t">
          <div className="mb-8 flex max-w-2xl flex-col gap-2">
            <Heading level="h2">{c.collection.heading}</Heading>
            {c.collection.intro ? <Text tone="muted">{c.collection.intro}</Text> : null}
          </div>
          <Projects items={c.collection.items} />
        </Section>
      ) : null}

      <Section id="contact" spacing="lg" className="border-border border-t">
        <Conversion
          title={c.conversion.title}
          description={c.conversion.description}
          primaryCta={c.conversion.primaryCta}
          phone={businessConfig.telephone}
        />
      </Section>
    </>
  );
}

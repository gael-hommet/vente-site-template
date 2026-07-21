"use client";

import { getNavigationRecipe, hasNavigationRecipe } from "@/ace/recipes";
import { ThemeToggle } from "@/components/layout/theme";
import { resolvedClient } from "@/config/client.resolved";
import { resolvedFeatures } from "@/config/features.generated";
import { siteContent } from "@/config/site-content";
import { siteConfig } from "@/config/site";

/**
 * En-tête CONFIG-DRIVEN : monte la recipe de navigation sélectionnée
 * (`client.resolved.ts`) avec la marque + les liens du contenu. Les recettes
 * de navigation portent leur propre `<header>` sticky, leur menu mobile et leur
 * CTA — deux recipes différentes donnent une navigation structurellement
 * différente (barre fine vs folio numéroté vs overlay plein écran vs premium
 * centré).
 *
 * Le bouton de thème (si `darkMode`) est posé en flottant discret : les
 * recettes de navigation n'ont pas de slot dédié et doivent rester génériques.
 */
export function ConfiguredHeader() {
  const requested = resolvedClient.recipes.navigation;
  let navId = requested;
  if (!hasNavigationRecipe(requested)) {
    navId = "minimal-header";
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[ACE] navigation inconnue "${requested}" dans client.resolved.ts — repli sur "minimal-header". Corrigez l'id.`,
      );
    }
  }
  const Nav = getNavigationRecipe(navId).Component;

  return (
    <>
      <Nav
        brand={siteConfig.name}
        links={siteContent.nav}
        cta={siteContent.conversion.primaryCta}
      />
      {resolvedFeatures.darkMode ? (
        <ThemeToggle className="fixed top-3 right-3 z-50 bg-[var(--surface)]/70 backdrop-blur" />
      ) : null}
    </>
  );
}

import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { ConfiguredHome } from "@/components/site/ConfiguredHome";
import { ConfiguredHeader } from "@/components/site/ConfiguredHeader";
import { ThemeProvider } from "@/components/layout/theme";
import { siteContent } from "@/config/site-content";
import { resolvedClient } from "@/config/client.resolved";
import { layoutMainClass, LAYOUT_MAIN_CLASS } from "@/ace/recipes/layouts";

/**
 * Le rendu config-driven est ce qui rend la sélection de recipes réellement
 * observable (validation anti-template). Ces tests sont STRUCTURELS et
 * agnostiques du contenu : ils valent dans le moteur ET dans chaque site
 * généré (qui a son propre contenu), sans dépendre du Canvas.
 */

describe("ConfiguredHome (rendu config-driven)", () => {
  it("monte le hero avec le titre du contenu et un h1 unique", () => {
    render(<ConfiguredHome />);
    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent(siteContent.hero.title);
  });

  it("rend la section storytelling avec son titre de section", () => {
    render(<ConfiguredHome />);
    const story = document.getElementById("story");
    expect(story).not.toBeNull();
    expect(within(story as HTMLElement).getByText(siteContent.story.heading)).toBeInTheDocument();
    // Au moins un chapitre rendu (le contenu peut répéter des titres neutres).
    expect(story!.textContent).toContain(siteContent.story.chapters[0].body);
  });

  it("expose le CTA de conversion vers /contact", () => {
    render(<ConfiguredHome />);
    const contactLinks = screen
      .getAllByRole("link")
      .filter((el) => el.getAttribute("href") === "/contact");
    expect(contactLinks.length).toBeGreaterThanOrEqual(1);
  });

  it("le contenu est atteignable sans Canvas (aucun <canvas> requis pour le texte)", () => {
    const { container } = render(<ConfiguredHome />);
    // Le hero, le storytelling et la conversion rendent du texte réel même
    // sans WebGL (les scènes sont différées et gatées par tier).
    expect(container.textContent).toContain(siteContent.hero.title);
    expect(container.textContent).toContain(siteContent.conversion.title);
  });

  it("applique RÉELLEMENT la recipe de layout (data-layout + classe de conteneur observable)", () => {
    const { container } = render(<ConfiguredHome />);
    const layoutEl = container.querySelector("[data-layout]");
    expect(layoutEl).not.toBeNull();
    // L'id de layout résolu est celui du contrat, et sa classe est appliquée.
    const id = resolvedClient.recipes.layout || "editorial-layout";
    expect(layoutEl!.getAttribute("data-layout")).toBe(id);
    for (const cls of layoutMainClass(id).split(" ")) {
      expect(layoutEl!.className).toContain(cls);
    }
  });
});

describe("layoutMainClass — la recipe de layout a un effet DOM distinct", () => {
  it("chaque layout produit une classe de conteneur différente (pas d'alias)", () => {
    const ids = Object.keys(LAYOUT_MAIN_CLASS);
    const classes = ids.map((id) => layoutMainClass(id));
    // Deux layouts distincts ⇒ classes distinctes (sinon la sélection layout
    // serait un faux signal anti-template — c'était le finding corrigé).
    expect(new Set(classes).size).toBe(ids.length);
    expect(layoutMainClass("editorial-layout")).not.toBe(layoutMainClass("immersive-layout"));
  });

  it("un id inconnu retombe sur editorial-layout", () => {
    expect(layoutMainClass("does-not-exist")).toBe(LAYOUT_MAIN_CLASS["editorial-layout"]);
  });
});

describe("ConfiguredHeader (navigation config-driven)", () => {
  it("monte la recipe de navigation résolue avec les liens du contenu", () => {
    render(
      <ThemeProvider>
        <ConfiguredHeader />
      </ThemeProvider>,
    );
    // Un lien pointant vers la destination du premier lien de nav est présent.
    // (Le libellé accessible peut inclure un numéro de folio selon la recipe,
    // donc on cible le href, pas le texte exact.)
    const firstLink = siteContent.nav[0];
    const links = screen
      .getAllByRole("link")
      .filter((el) => el.getAttribute("href") === firstLink.href);
    expect(links.length).toBeGreaterThanOrEqual(1);
  });
});

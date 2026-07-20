import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { ConfiguredHome } from "@/components/site/ConfiguredHome";
import { ConfiguredHeader } from "@/components/site/ConfiguredHeader";
import { ThemeProvider } from "@/components/layout/theme";
import { siteContent } from "@/config/site-content";

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
});

describe("ConfiguredHeader (navigation config-driven)", () => {
  it("monte la recipe de navigation résolue avec les liens du contenu", () => {
    render(
      <ThemeProvider>
        <ConfiguredHeader />
      </ThemeProvider>,
    );
    // Les liens de nav sont présents (au moins le premier).
    const firstLink = siteContent.nav[0];
    expect(screen.getAllByRole("link", { name: firstLink.label }).length).toBeGreaterThanOrEqual(1);
  });
});

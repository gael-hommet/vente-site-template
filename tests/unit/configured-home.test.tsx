import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConfiguredHome } from "@/components/site/ConfiguredHome";
import { ConfiguredHeader } from "@/components/site/ConfiguredHeader";
import { ThemeProvider } from "@/components/layout/theme";
import { siteContent } from "@/config/site-content";
import { resolvedClient } from "@/config/client.resolved";

/**
 * Le rendu config-driven est ce qui rend la sélection de recipes réellement
 * observable (validation anti-template). Ces tests vérifient qu'avec le contenu
 * neutre du moteur, la home et l'en-tête montent bien les recipes résolues et
 * exposent le contenu attendu, sans Canvas requis.
 */

describe("ConfiguredHome (rendu config-driven)", () => {
  it("monte le hero avec le titre du contenu et un h1 unique", () => {
    render(<ConfiguredHome />);
    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent(siteContent.hero.title);
  });

  it("rend le storytelling (chaque chapitre présent) sans dépendre du Canvas", () => {
    render(<ConfiguredHome />);
    for (const chapter of siteContent.story.chapters) {
      expect(screen.getByText(chapter.title)).toBeInTheDocument();
    }
  });

  it("expose le CTA de conversion vers /contact", () => {
    render(<ConfiguredHome />);
    const cta = screen.getAllByRole("link", {
      name: new RegExp(siteContent.conversion.primaryCta.label, "i"),
    });
    expect(cta.length).toBeGreaterThanOrEqual(1);
    expect(cta.some((el) => el.getAttribute("href") === "/contact")).toBe(true);
  });

  it("n'invente aucun chiffre/prix/avis dans le contenu neutre", () => {
    const { container } = render(<ConfiguredHome />);
    expect(container.textContent).not.toMatch(/\d+\s?€|\d+\s?%|[45][.,]\d\/5/);
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

  it("utilise l'id de recipe résolu (defaut moteur = minimal-header)", () => {
    expect(resolvedClient.recipes.navigation).toBe("minimal-header");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { CINEMATIC_SCROLL_STRATEGIES } from "@/components/media/CinematicScroll";

/**
 * CinematicScroll orchestre les composants scroll-cinéma EXISTANTS selon la
 * stratégie. Ces tests vérifient : (1) le repli poster sous reduced-motion pour
 * TOUTES les stratégies (contenu lisible, jamais de 3D cheap), (2) l'overlay de
 * chapitres/CTA. `useReducedMotion` est moqué pour un contrôle déterministe et
 * pour éviter d'invoquer GSAP en jsdom.
 */

vi.mock("@/hooks/useReducedMotion", () => ({ useReducedMotion: vi.fn() }));
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { CinematicScroll } from "@/components/media/CinematicScroll";

const asMock = useReducedMotion as unknown as ReturnType<typeof vi.fn>;

describe("CinematicScroll — orchestration générique", () => {
  beforeEach(() => asMock.mockReset());

  it("sous reduced-motion : poster statique + chapitres (aucune 3D, contenu lisible)", () => {
    asMock.mockReturnValue(true);
    render(
      <CinematicScroll
        strategy="video-scroll"
        sources={[{ src: "/v.webm", type: "video/webm" }]}
        poster="/poster.jpg"
        alt="Aperçu de la scène"
        chapters={[
          { at: 0, title: "Ouverture" },
          { at: 0.5, title: "Révélation" },
        ]}
      />,
    );
    // Le poster (img alt) est présent.
    expect(screen.getByAltText("Aperçu de la scène")).toBeInTheDocument();
    // Les chapitres sont atteignables.
    expect(screen.getByText("Ouverture")).toBeInTheDocument();
    expect(screen.getByText("Révélation")).toBeInTheDocument();
  });

  it("stratégie non-vidéo/frames (2.5d/webgl/hybrid) : repli poster propre, jamais de canvas 3D", () => {
    asMock.mockReturnValue(false);
    const { container } = render(
      <CinematicScroll strategy="webgl" poster="/poster.jpg" alt="Aperçu" />,
    );
    expect(screen.getByAltText("Aperçu")).toBeInTheDocument();
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("l'overlay CTA reste atteignable (non bloquant)", () => {
    asMock.mockReturnValue(true);
    render(
      <CinematicScroll
        strategy="editorial-fallback"
        poster="/p.jpg"
        alt="A"
        cta={<a href="/contact">Nous contacter</a>}
      />,
    );
    expect(screen.getByRole("link", { name: /Nous contacter/ })).toHaveAttribute(
      "href",
      "/contact",
    );
  });

  it("expose les stratégies réellement orchestrées (video-scroll, image-sequence)", () => {
    expect(CINEMATIC_SCROLL_STRATEGIES).toContain("video-scroll");
    expect(CINEMATIC_SCROLL_STRATEGIES).toContain("image-sequence");
    expect(CINEMATIC_SCROLL_STRATEGIES).not.toContain("webgl");
  });
});

import { describe, it, expect } from "vitest";
import { chooseDeliveryMode, SEQUENCE_MAX_FRAMES } from "@/ace/media-engine";
import { activeChapterIndex } from "@/components/media/CinematicScroll";

/**
 * Choix VIDEO_SCROLL vs IMAGE_SEQUENCE : décision prise sur des CHIFFRES
 * (poids réels, nombre de frames, budget), jamais sur une préférence. Et
 * synchronisation réelle des chapitres du scroll-cinéma.
 */

const base = {
  durationS: 6,
  scrubFps: 12,
  videoWeightKb: 800,
  avgFrameWeightKb: 20,
  framePrecisionRequired: false,
  mobileConstrained: false,
};

describe("Mode de diffusion — arbitrage chiffré", () => {
  it("retient la séquence quand la précision est requise et le poids raisonnable", () => {
    const d = chooseDeliveryMode({ ...base, framePrecisionRequired: true });
    expect(d.mode).toBe("IMAGE_SEQUENCE");
    expect(d.frameCount).toBe(72);
    expect(d.sequenceWeightKb).toBe(1440);
    expect(d.preload).toBe("progressive-batches");
  });

  it("bascule en vidéo quand la séquence explose le nombre de frames", () => {
    const d = chooseDeliveryMode({ ...base, durationS: 60, framePrecisionRequired: true });
    expect(d.frameCount).toBeGreaterThan(SEQUENCE_MAX_FRAMES);
    expect(d.mode).toBe("VIDEO_SCROLL");
    // La contrainte non satisfaite est DITE, pas masquée.
    expect(d.caveats.join(" ")).toMatch(/Précision image par image/i);
  });

  it("bascule en vidéo quand la séquence dépasse le budget de poids", () => {
    const d = chooseDeliveryMode({
      ...base,
      avgFrameWeightKb: 60,
      weightBudgetKb: 2000,
      framePrecisionRequired: true,
    });
    expect(d.mode).toBe("VIDEO_SCROLL");
    expect(d.rationale).toMatch(/budget/i);
  });

  it("sur mobile contraint, privilégie le plus léger", () => {
    const d = chooseDeliveryMode({ ...base, mobileConstrained: true, videoWeightKb: 300 });
    expect(d.mode).toBe("VIDEO_SCROLL");
    expect(d.rationale).toMatch(/mobile/i);
  });

  it("sans exigence de précision, la variante la plus légère gagne", () => {
    const lighterSequence = chooseDeliveryMode({ ...base, avgFrameWeightKb: 5 });
    expect(lighterSequence.sequenceWeightKb).toBeLessThan(lighterSequence.videoWeightKb);
    expect(lighterSequence.mode).toBe("IMAGE_SEQUENCE");

    const lighterVideo = chooseDeliveryMode({ ...base, videoWeightKb: 200 });
    expect(lighterVideo.mode).toBe("VIDEO_SCROLL");
  });

  it("signale un master vidéo déjà hors budget", () => {
    const d = chooseDeliveryMode({ ...base, videoWeightKb: 5000, weightBudgetKb: 1000 });
    expect(d.caveats.join(" ")).toMatch(/dépasse déjà le budget/i);
  });
});

describe("Chapitres du scroll-cinéma — synchronisation réelle", () => {
  const chapters = [
    { at: 0, title: "Ouverture" },
    { at: 0.5, title: "Révélation" },
    { at: 0.9, title: "Final" },
  ];

  it("suit la progression (dernier chapitre franchi)", () => {
    expect(activeChapterIndex(chapters, 0)).toBe(0);
    expect(activeChapterIndex(chapters, 0.49)).toBe(0);
    expect(activeChapterIndex(chapters, 0.5)).toBe(1);
    expect(activeChapterIndex(chapters, 0.95)).toBe(2);
  });

  it("ne plante pas sans chapitres", () => {
    expect(activeChapterIndex(undefined, 0.5)).toBe(-1);
    expect(activeChapterIndex([], 0.5)).toBe(-1);
  });
});

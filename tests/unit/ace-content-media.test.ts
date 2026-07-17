import { describe, expect, it } from "vitest";
import { TO_CONFIRM_MARK, hasUnconfirmed, renderText, toConfirm, verified } from "@/ace/content";
import { imageAssetSchema, validateVideoAsset } from "@/ace/media";

describe("ace-content (intégrité du contenu)", () => {
  it("renders verified content as-is", () => {
    expect(renderText(verified("Ouvert du mardi au samedi"))).toBe("Ouvert du mardi au samedi");
  });

  it("always marks unverified content — a draft can never pass as a fact", () => {
    expect(renderText(toConfirm("Depuis 1998"))).toBe(`Depuis 1998 ${TO_CONFIRM_MARK}`);
    expect(renderText(toConfirm())).toBe(TO_CONFIRM_MARK);
  });

  it("detects remaining unconfirmed values", () => {
    expect(hasUnconfirmed([verified("a"), toConfirm("b")])).toBe(true);
    expect(hasUnconfirmed([verified("a"), verified("b")])).toBe(false);
  });
});

describe("ace-media contracts (anti-CLS, a11y)", () => {
  it("requires explicit dimensions on images", () => {
    expect(() => imageAssetSchema.parse({ src: "/a.webp", alt: "x" })).toThrow();
    expect(() =>
      imageAssetSchema.parse({ src: "/a.webp", alt: "x", width: 1200, height: 800 }),
    ).not.toThrow();
  });

  it("requires a poster on videos", () => {
    expect(() =>
      validateVideoAsset({ src: "/v.mp4", alt: "x", width: 1920, height: 1080 }),
    ).toThrow();
  });

  it("refuses spoken video without captions", () => {
    expect(() =>
      validateVideoAsset({
        src: "/v.mp4",
        poster: "/p.webp",
        alt: "x",
        width: 1920,
        height: 1080,
        hasSpeech: true,
      }),
    ).toThrow(/captions/);
  });

  it("accepts a complete, accessible video", () => {
    expect(() =>
      validateVideoAsset({
        src: "/v.mp4",
        poster: "/p.webp",
        alt: "Présentation de l'atelier",
        width: 1920,
        height: 1080,
        hasSpeech: true,
        captions: "/v.vtt",
      }),
    ).not.toThrow();
  });
});

import { describe, it, expect } from "vitest";
import { loadClientConfig, inspectClientConfig, ClientConfigError } from "@/ace/config/client-loader";
import { resolveFeatures, findFeatureConflicts } from "@/ace/config/features";
import { neutralClientConfig } from "@/ace/config/client-defaults";
import { clientConfigSchema, type ClientConfigInput } from "@/ace/config/client-schema";

describe("ACE client contract — validation & défauts", () => {
  it("accepte une configuration MINIMALE (juste un nom)", () => {
    const { config, features } = loadClientConfig({ identity: { name: "Studio X" } });
    expect(config.identity.name).toBe("Studio X");
    // Aucun secteur obligatoire.
    expect(config.industry).toBe("other");
    // Défauts sains appliqués.
    expect(config.identity.locale).toBe("fr-FR");
    expect(config.design.preset).toBe("neutral");
    expect(config.design.motionIntensity).toBe("subtle");
    expect(config.design.webglIntensity).toBe("none");
    expect(config.goals.primaryConversion).toBe("contact");
    expect(features.contactForm).toBe(true);
    expect(features.webgl).toBe(false);
  });

  it("accepte la configuration NEUTRE par défaut", () => {
    const r = inspectClientConfig(neutralClientConfig);
    expect(r.ok).toBe(true);
  });

  it("accepte une configuration COMPLÈTE multi-sections", () => {
    const full: ClientConfigInput = {
      identity: { name: "Hôtel Azur", url: "https://azur.example", locale: "fr-FR", locales: ["fr-FR", "en-US"] },
      industry: "hospitality",
      audience: { primary: "voyageurs premium", segments: ["couples", "affaires"] },
      goals: { primaryConversion: "booking", secondary: ["newsletter"] },
      design: { preset: "onyx", motionIntensity: "cinematic", webglIntensity: "immersive", density: "spacious", darkMode: true },
      features: { contactForm: true, map: true, i18n: true },
      recipes: { hero: "media-first", navigation: "immersive-overlay", conversion: "appointment-ready" },
      pages: [{ key: "home", path: "/", title: "Accueil", standard: "home" }],
      collections: [{ id: "rooms", label: "Chambres", itemLabel: "chambre", kind: "rooms", basePath: "/chambres" }],
      team: [{ name: "Directrice", role: "Direction" }],
      form: { kind: "booking", fields: [{ name: "dates", label: "Dates", type: "text", required: true }] },
      seo: { titleTemplate: "%s · Hôtel Azur", noindex: false },
      analytics: { provider: "plausible", id: "azur.example" },
      privacy: { cookieBanner: true, policyPath: "/confidentialite" },
      proposal: { isPrivateProposal: true, notice: "Proposition privée" },
      contact: { email: "contact@azur.example", telephone: "+33100000000" },
    };
    const { config, features } = loadClientConfig(full);
    expect(config.industry).toBe("hospitality");
    expect(config.collections?.[0].kind).toBe("rooms");
    expect(features.webgl).toBe(true); // dérivé de webglIntensity=immersive
    expect(features.smoothScroll).toBe(true); // dérivé de motionIntensity=cinematic
    expect(features.i18n).toBe(true);
    expect(features.analytics).toBe(true);
    expect(features.map).toBe(true);
  });

  it("REJETTE des champs invalides", () => {
    // nom manquant
    expect(() => loadClientConfig({ identity: {} } as unknown as ClientConfigInput)).toThrow(
      ClientConfigError,
    );
    // industrie hors énumération
    expect(() =>
      loadClientConfig({ identity: { name: "X" }, industry: "aerospace" } as unknown as ClientConfigInput),
    ).toThrow(ClientConfigError);
    // url non-url
    expect(() =>
      loadClientConfig({ identity: { name: "X", url: "pas-une-url" } }),
    ).toThrow(ClientConfigError);
    // email invalide
    expect(() =>
      loadClientConfig({ identity: { name: "X" }, contact: { email: "nope" } }),
    ).toThrow(ClientConfigError);
    // id de collection non slug
    expect(() =>
      loadClientConfig({
        identity: { name: "X" },
        collections: [{ id: "Bad Id", label: "L", itemLabel: "i" }],
      }),
    ).toThrow(ClientConfigError);
  });

  it("expose les problèmes via inspectClientConfig (sans lever)", () => {
    const r = inspectClientConfig({ identity: {} } as unknown as ClientConfigInput);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.join(" ")).toMatch(/name/i);
  });

  it("REJETTE une recipe inexistante et ACCEPTE des ids valides", () => {
    expect(() =>
      loadClientConfig({ identity: { name: "X" }, recipes: { hero: "nope" } }),
    ).toThrow(ClientConfigError);
    const { config } = loadClientConfig({
      identity: { name: "X" },
      recipes: { hero: "media-first", navigation: "immersive-overlay", conversion: "premium-inquiry" },
    });
    expect(config.recipes.hero).toBe("media-first");
  });
});

describe("ACE client contract — feature flags & incompatibilités", () => {
  it("dérive les flags implicites depuis les intensités et le contenu", () => {
    const cfg = clientConfigSchema.parse({
      identity: { name: "X", locales: ["fr-FR", "en-US"] },
      design: { webglIntensity: "accent", motionIntensity: "cinematic" },
      collections: [{ id: "cases", label: "Cas", itemLabel: "cas" }],
      analytics: { provider: "ga4", id: "G-1" },
    });
    const f = resolveFeatures(cfg);
    expect(f.webgl).toBe(true);
    expect(f.smoothScroll).toBe(true);
    expect(f.collections).toBe(true);
    expect(f.i18n).toBe(true);
    expect(f.analytics).toBe(true);
  });

  it("un flag explicite l'emporte sur la dérivation", () => {
    const cfg = clientConfigSchema.parse({
      identity: { name: "X" },
      design: { webglIntensity: "none" },
      features: { smoothScroll: true },
    });
    const f = resolveFeatures(cfg);
    expect(f.webgl).toBe(false);
    expect(f.smoothScroll).toBe(true); // forcé explicitement
  });

  it("détecte webgl=false incompatible avec webglIntensity≠none", () => {
    const cfg = clientConfigSchema.parse({
      identity: { name: "X" },
      design: { webglIntensity: "immersive" },
      features: { webgl: false },
    });
    const conflicts = findFeatureConflicts(cfg);
    expect(conflicts.some((c) => c.feature === "webgl")).toBe(true);
    expect(() => loadClientConfig({ identity: { name: "X" }, design: { webglIntensity: "immersive" }, features: { webgl: false } })).toThrow(
      ClientConfigError,
    );
  });

  it("détecte i18n=true sans 2 locales, et analytics sans id", () => {
    expect(
      findFeatureConflicts(clientConfigSchema.parse({ identity: { name: "X" }, features: { i18n: true } })).some(
        (c) => c.feature === "i18n",
      ),
    ).toBe(true);
    expect(
      findFeatureConflicts(
        clientConfigSchema.parse({ identity: { name: "X" }, analytics: { provider: "ga4" } }),
      ).some((c) => c.feature === "analytics"),
    ).toBe(true);
  });
});

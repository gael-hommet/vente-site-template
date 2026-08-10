import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { RECIPE_IDS } from "@/ace/recipes/catalog";
import {
  INDUSTRIES,
  MOTION_INTENSITIES,
  WEBGL_INTENSITIES,
  DENSITIES,
} from "@/ace/config/client-schema";
import {
  detectIntent,
  missionSlug,
  slugify,
  extractUrl,
  extractBusinessName,
  detectIndustry,
  decideArtDirection,
  requiresGeneratedMedia,
  PROFILED_SECTORS,
  createMission,
  advance,
  block,
  unblock,
  beginStep,
  endStep,
  resumeState,
  lastCompletedState,
  nextState,
  isTerminal,
  environmentGate,
  assetGate,
  rightsGate,
  factsGate,
  qualityGate,
  deploymentGate,
  userReport,
  technicalReport,
  AUTOPILOT_STATES,
  type AutopilotMission,
} from "@/ace/autopilot";
import {
  hasVisualMaterial,
  validateInventory,
  usableAssets,
  bestAssetFor,
  provenanceDisclosure,
  productionBlockers,
  type AssetInventory,
  type AssetRecord,
} from "@/ace/media-engine";
import { AUTOPILOT_POLICY } from "@/config/ace-autopilot-policy";

/**
 * ACE AUTOPILOT — tests du cerveau d'orchestration.
 *
 * Ces tests protègent les promesses faites à un utilisateur NON TECHNIQUE :
 * une phrase suffit, rien n'est inventé, rien n'est publié, et une coupure de
 * session ne fait pas repartir de zéro.
 */

const NOW = "2026-01-01T00:00:00.000Z";

function mission(brief: string): AutopilotMission {
  const intent = detectIntent(brief);
  return createMission({ id: "m1", brief, intent, slug: missionSlug(intent), now: NOW });
}

describe("Détection d'intention — une phrase suffit", () => {
  it("reconnaît une demande de site et en extrait ce qu'elle peut", () => {
    const i = detectIntent("Fais-moi un site premium pour ce restaurant : https://chez-marcel.fr");
    expect(i.isSiteMission).toBe(true);
    expect(i.sourceUrl).toBe("https://chez-marcel.fr");
    expect(i.industry).toBe("hospitality");
    expect(i.styleHints).toContain("premium");
    expect(i.confidence).toBeGreaterThan(0.6);
  });

  it("reconnaît une refonte et une démo privée", () => {
    expect(detectIntent("Refais complètement ce site, je veux du haut de gamme.").deliverable).toBe(
      "redesign",
    );
    expect(detectIntent("Fais une démo privée pour cette entreprise de chalets.").deliverable).toBe(
      "demo",
    );
  });

  it("NE se déclenche PAS sur une question ordinaire", () => {
    const i = detectIntent("Comment fonctionne le cache de Next.js ?");
    expect(i.isSiteMission).toBe(false);
  });

  it("n'invente jamais un nom d'entreprise à partir d'un démonstratif", () => {
    // « pour ce restaurant » ne doit pas devenir la raison sociale.
    expect(extractBusinessName("Fais un site pour ce restaurant")).toBeNull();
    expect(extractBusinessName("Fais un site pour Atelier Nova, mobilier")).toBe("Atelier Nova");
  });

  it("liste ce qu'il faudra CHERCHER plutôt que de le demander tout de suite", () => {
    const i = detectIntent("Fais un site pour Atelier Nova.");
    expect(i.unknowns.length).toBeGreaterThan(0);
    expect(i.unknowns.join(" ")).toMatch(/coordonn|offre/i);
  });

  it("extrait un domaine nu et déduit un slug utilisable", () => {
    expect(extractUrl("leur site est chez-marcel.fr voilà")).toBe("https://chez-marcel.fr");
    expect(slugify("Atelier Nova & Cie")).toBe("atelier-nova-cie");
    // Un slug doit toujours commencer par une lettre (exigence du générateur).
    expect(slugify("2024 Studio")).toMatch(/^[a-z]/);
  });

  it("détecte les secteurs courants", () => {
    expect(detectIndustry("un cabinet dentaire")).toBe("medical");
    expect(detectIndustry("une agence immobilière")).toBe("real-estate");
    expect(detectIndustry("un garage automobile")).toBe("automotive");
  });
});

describe("Direction artistique autonome — ACE tranche", () => {
  it("ne propose QUE des recipes réellement existantes (toutes familles)", () => {
    // Régression : des ids d'une famille avaient été utilisés dans une autre.
    const sectors = [...PROFILED_SECTORS, "secteur-inconnu"];
    for (const industry of sectors) {
      const ad = decideArtDirection({
        ...detectIntent("Fais un site premium"),
        industry,
      });
      for (const family of Object.keys(RECIPE_IDS) as (keyof typeof RECIPE_IDS)[]) {
        expect(
          (RECIPE_IDS[family] as readonly string[]).includes(ad.recipes[family]),
          `${industry} → ${family}="${ad.recipes[family]}" n'existe pas`,
        ).toBe(true);
      }
      expect(MOTION_INTENSITIES).toContain(ad.motionIntensity);
      expect(WEBGL_INTENSITIES).toContain(ad.webglIntensity);
      expect(DENSITIES).toContain(ad.density);
    }
  });

  it("ne cible que des secteurs connus du schéma client", () => {
    for (const s of PROFILED_SECTORS) expect(INDUSTRIES).toContain(s);
  });

  it("adapte la direction aux mots de l'utilisateur", () => {
    const calm = decideArtDirection(
      detectIntent("Fais un site sobre et rassurant pour un restaurant"),
    );
    expect(calm.motionIntensity).not.toBe("cinematic");
    expect(calm.webglIntensity).toBe("none");

    const bold = decideArtDirection(detectIntent("Fais un site immersif pour un cabinet dentaire"));
    expect(bold.motionIntensity).toBe("cinematic");
  });

  it("justifie toujours son choix (jamais un tirage au sort)", () => {
    const ad = decideArtDirection(detectIntent("Fais un site pour un architecte"));
    expect(ad.rationale.length).toBeGreaterThan(20);
    expect(ad.concept.length).toBeGreaterThan(10);
    expect(ad.agentSupplied).toBe(false);
  });

  it("n'exige AUCUNE génération quand le client fournit ses visuels", () => {
    const ad = decideArtDirection(detectIntent("Fais un site premium pour un restaurant"));
    expect(requiresGeneratedMedia(ad)).toBe(true);
    expect(requiresGeneratedMedia(ad, { hasUsableAssets: true })).toBe(false);
  });
});

describe("Garde-fous", () => {
  it("bloque proprement quand l'environnement n'est pas prêt", () => {
    const g = environmentGate({ canBuildSites: false, canGenerateMedia: false });
    expect(g.pass).toBe(false);
    expect(g.reason).toBe("ENVIRONMENT_NOT_READY");
  });

  it("exige au minimum d'avoir identifié l'entreprise", () => {
    expect(factsGate({ facts: [], notFound: [] }).pass).toBe(false);
    expect(
      factsGate({
        facts: [{ key: "businessName", value: "X", source: "user", confidence: "claimed" }],
        notFound: [],
      }).pass,
    ).toBe(true);
  });

  it("itère tant que la qualité n'y est pas, puis s'arrête honnêtement", () => {
    expect(qualityGate({ score: 0.9, iterationsDone: 0 }).pass).toBe(true);
    const retry = qualityGate({ score: 0.4, iterationsDone: 0 });
    expect(retry.pass).toBe(false);
    expect(retry.reason).toBeNull(); // on retente
    const giveUp = qualityGate({
      score: 0.4,
      iterationsDone: AUTOPILOT_POLICY.quality.maxVisualIterations,
    });
    expect(giveUp.reason).toBe("QUALITY_NOT_REACHED");
  });

  it("ne déploie JAMAIS automatiquement", () => {
    const g = deploymentGate();
    expect(g.pass).toBe(false);
    expect(g.message).toMatch(/aucune publication/i);
  });

  it("interdit explicitement push, déploiement et invention d'informations", () => {
    const f = AUTOPILOT_POLICY.autonomy.forbidden.join(" ");
    expect(f).toMatch(/pousser sur GitHub/i);
    expect(f).toMatch(/déployer en production/i);
    expect(f).toMatch(/inventer des informations/i);
  });
});

describe("Machine à états & reprise", () => {
  it("suit l'ordre nominal sans sauter d'étape", () => {
    let m = mission("Fais un site pour Atelier Nova");
    expect(m.state).toBe("INTAKE");
    m = advance(m, NOW);
    expect(m.state).toBe("RESEARCH");
    expect(nextState("PREVIEW")).toBe("COMPLETE");
    expect(isTerminal("COMPLETE")).toBe(true);
  });

  it("reprend à l'étape SUIVANTE de la dernière étape réussie", () => {
    let m = mission("Fais un site pour Atelier Nova");
    for (const s of [
      "INTAKE",
      "RESEARCH",
      "FACT_CHECK",
      "ASSET_DISCOVERY",
      "ASSET_VALIDATION",
      "ART_DIRECTION",
    ] as const) {
      m = beginStep({ ...m, state: s }, s, NOW);
      m = endStep(m, { ok: true }, NOW);
    }
    expect(lastCompletedState(m)).toBe("ART_DIRECTION");
    // Interruption après ART_DIRECTION ⇒ on reprend à l'étape suivante, jamais
    // au début. Depuis l'ajout de la rédaction, la suivante est CONTENT.
    expect(resumeState(m)).toBe("CONTENT");

    // Et une fois la rédaction faite, on reprend bien à MEDIA_PLAN
    // (attente littérale du test 4 du mandat).
    let n = beginStep({ ...m, state: "CONTENT" }, "CONTENT", NOW);
    n = endStep(n, { ok: true }, NOW);
    expect(resumeState(n)).toBe("MEDIA_PLAN");
  });

  it("conserve le travail fait quand la mission est bloquée puis reprise", () => {
    let m = mission("Fais un site pour Atelier Nova");
    m = beginStep(m, "INTAKE", NOW);
    m = endStep(m, { ok: true, notes: ["ok"] }, NOW);
    m = block(m, "MEDIA_ASSET_REQUIRED", NOW);
    expect(m.state).toBe("BLOCKED");
    expect(m.steps).toHaveLength(1); // rien n'est perdu
    const resumed = unblock(m, resumeState(m), NOW);
    expect(resumed.state).toBe("RESEARCH");
    expect(resumed.blockedReason).toBeNull();
  });
});

describe("Rapports — deux publics", () => {
  it("le rapport utilisateur reste sans jargon et dit qu'on n'a rien publié", () => {
    let m = mission("Fais un site pour Atelier Nova");
    m = { ...m, state: "COMPLETE", previewUrl: "http://localhost:3000" };
    const r = userReport(m);
    expect(r).toContain("Le site est prêt.");
    expect(r).toContain("http://localhost:3000");
    expect(r).toMatch(/aucune publication/i);
    // Aucun terme technique ne doit fuiter vers l'utilisateur.
    expect(r).not.toMatch(/pnpm|vitest|ffmpeg|typecheck|webgl|zod/i);
  });

  it("le rapport utilisateur explique un blocage sans log technique", () => {
    const m = block(mission("Fais un site"), "MEDIA_ASSET_REQUIRED", NOW);
    const r = userReport(m);
    expect(r).toMatch(/visuel/i);
    // Ni jargon, ni mention d'un service payant.
    expect(r).not.toMatch(/hf-api|exit \d|stderr|provider|API/i);
  });

  it("le rapport technique, lui, contient bien le détail", () => {
    let m = mission("Fais un site premium pour Atelier Nova");
    m = { ...m, artDirection: decideArtDirection(m.intent) };
    m = beginStep(m, "SITE_BUILD", NOW);
    m = endStep(m, { ok: true, commands: ["node scripts/ace/new-site.mjs …"] }, NOW);
    const r = technicalReport(m);
    expect(r).toContain("new-site.mjs");
    expect(r).toContain("## Direction artistique");
    expect(r).toMatch(/AUTOPILOT ne pousse ni ne déploie/i);
  });
});

describe("Scénarios du mandat", () => {
  it("TEST 6 — une mission COMPLETE ne pousse ni ne déploie jamais", () => {
    let m = mission("Fais un site pour Atelier Nova");
    m = { ...m, state: "COMPLETE", targetDir: "/workspaces/atelier-nova" };
    const report = userReport(m);
    expect(report).toMatch(/aucune publication/i);
    // Le gate de déploiement refuse par construction.
    expect(deploymentGate().pass).toBe(false);
    // Et la politique l'interdit explicitement.
    expect(AUTOPILOT_POLICY.autonomy.forbidden.join(" ")).toMatch(/pousser|déployer/i);
  });

  it("le rapport reste honnête quand aucune preview n'est active", () => {
    let m = mission("Fais un site");
    m = { ...m, state: "COMPLETE", targetDir: "/tmp/x", previewUrl: null };
    // On n'invente pas une adresse qui ne répond pas.
    expect(userReport(m)).not.toMatch(/localhost:\d+/);
  });
});

describe("ACE 0.2.2 — coût média nul, aucun service de génération", () => {
  const asset = (over: Partial<AssetRecord> = {}): AssetRecord => ({
    path: "/assets/client/photo-01.jpg",
    source: "OFFICIAL_WEBSITE",
    sourceRef: "https://exemple.test/galerie",
    nature: "REAL",
    role: "gallery",
    kind: "image",
    alt: "Vue de l'atelier",
    rights: "OFFICIAL_PUBLIC_UNCONFIRMED",
    ...over,
  });

  it("A — ace:doctor ne dépend d'AUCUN service de génération", () => {
    const doctor = readFileSync(
      path.join(__dirname, "../../scripts/ace/autopilot/doctor.mjs"),
      "utf8",
    );
    expect(doctor).not.toMatch(/higgsfield|hf-api|HIGGSFIELD/i);
    expect(doctor).not.toMatch(/ACE NEEDS ADMIN SETUP/);
  });

  it("B/C — des visuels (officiels OU fournis) suffisent : aucun blocage", () => {
    for (const source of [
      "OFFICIAL_WEBSITE",
      "CLIENT_PROVIDED",
      "USER_SUPPLIED_GENERATED",
    ] as const) {
      const inv: AssetInventory = {
        usage: "PRIVATE_DEMO",
        assets: [asset({ source, rights: "CONFIRMED" })],
        missing: [],
      };
      expect(hasVisualMaterial(inv)).toBe(true);
      expect(assetGate({ imageLedDirection: true, hasVisualMaterial: true }).pass).toBe(true);
    }
  });

  it("D/E/F — sans aucun visuel : on DEMANDE le média, jamais un provider ni une dépense", () => {
    const g = assetGate({ imageLedDirection: true, hasVisualMaterial: false });
    expect(g.pass).toBe(false);
    expect(g.reason).toBe("MEDIA_ASSET_REQUIRED");
    // Aucune trace du paradigme supprimé.
    expect(g.message).not.toMatch(/provider|générer|crédit|abonnement|coût/i);
    expect(JSON.stringify(AUTOPILOT_POLICY)).not.toMatch(/higgsfield|spend|approvalThreshold/i);
  });

  it("H — une démo privée conserve la provenance et l'annonce", () => {
    const inv: AssetInventory = { usage: "PRIVATE_DEMO", assets: [asset()], missing: [] };
    expect(validateInventory(inv).filter((i) => i.severity === "error")).toHaveLength(0);
    expect(provenanceDisclosure(inv)).toMatch(/propriété|officiels/i);
    expect(usableAssets(inv)[0]?.sourceRef).toBe("https://exemple.test/galerie");
  });

  it("I — en production, les droits non confirmés bloquent", () => {
    const inv: AssetInventory = { usage: "PRODUCTION", assets: [asset()], missing: [] };
    expect(productionBlockers(inv).length).toBeGreaterThan(0);
    const g = rightsGate({ usage: "PRODUCTION", unconfirmed: productionBlockers(inv) });
    expect(g.pass).toBe(false);
    expect(g.reason).toBe("MEDIA_RIGHTS_UNCONFIRMED");
    // Confirmés ⇒ plus de blocage.
    const ok: AssetInventory = {
      usage: "PRODUCTION",
      assets: [asset({ rights: "CONFIRMED" })],
      missing: [],
    };
    expect(productionBlockers(ok)).toHaveLength(0);
  });

  it("un média CONCEPTUEL ne peut pas illustrer une réalisation réelle", () => {
    const inv: AssetInventory = {
      usage: "PRIVATE_DEMO",
      assets: [asset({ nature: "CONCEPTUAL", role: "project", rights: "CONFIRMED" })],
      missing: [],
    };
    const errors = validateInventory(inv).filter((i) => i.severity === "error");
    expect(errors[0]?.message).toMatch(/trompeuse/i);
    expect(usableAssets(inv)).toHaveLength(0);
  });

  it("la hiérarchie des sources est respectée (client > officiel > fourni)", () => {
    const inv: AssetInventory = {
      usage: "PRIVATE_DEMO",
      assets: [
        asset({ path: "/c.jpg", source: "USER_SUPPLIED_GENERATED", rights: "CONFIRMED" }),
        asset({ path: "/a.jpg", source: "CLIENT_PROVIDED", rights: "CONFIRMED" }),
        asset({ path: "/b.jpg", source: "OFFICIAL_WEBSITE", rights: "CONFIRMED" }),
      ],
      missing: [],
    };
    expect(usableAssets(inv).map((a) => a.path)).toEqual(["/a.jpg", "/b.jpg", "/c.jpg"]);
    expect(bestAssetFor(inv, "gallery")?.path).toBe("/a.jpg");
  });

  it("E/L — le workflow ne contient plus ni génération, ni auth, ni approbation", () => {
    expect(AUTOPILOT_STATES).not.toContain("MEDIA_GENERATION");
    expect(AUTOPILOT_STATES).not.toContain("WAITING_FOR_APPROVAL");
    expect(AUTOPILOT_STATES).toContain("ASSET_DISCOVERY");
    expect(AUTOPILOT_STATES).toContain("ASSET_VALIDATION");
    expect(AUTOPILOT_STATES).toContain("MEDIA_PROCESSING");
    // L — aucune substitution low-poly : la stratégie reste un repli éditorial.
    const ad = decideArtDirection(detectIntent("Fais un site premium pour un restaurant"), {
      hasUsableAssets: false,
    });
    expect(ad.webglIntensity).not.toBe("immersive");
  });

  it("J/K — SITE_BUILD et MOBILE_QA sont de vraies étapes du workflow", () => {
    const run = readFileSync(path.join(__dirname, "../../scripts/ace/autopilot/run.ts"), "utf8");
    // Elles exécutent du travail, pas un simple jalon.
    expect(run).toMatch(/function doSiteBuild/);
    expect(run).toMatch(/function doMobileQa/);
    expect(existsSync(path.join(__dirname, "../../scripts/ace/autopilot/mobile-qa.mjs"))).toBe(
      true,
    );
    // La capture mobile est réellement prise par Playwright.
    const mobile = readFileSync(
      path.join(__dirname, "../../scripts/ace/autopilot/mobile-qa.mjs"),
      "utf8",
    );
    expect(mobile).toMatch(/page\.screenshot/);
    expect(mobile).toMatch(/scrollWidth/);
  });
});

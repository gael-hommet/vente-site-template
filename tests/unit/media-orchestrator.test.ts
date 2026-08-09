import { describe, it, expect } from "vitest";
import {
  orchestrateGeneration,
  buildShotPrompt,
  createBudget,
  createReferenceLock,
  routeModel,
  requiredMode,
  evaluatePremiumOutput,
  reviewArtDirection,
  canGenerate,
  recordSpend,
  summarizeBudget,
  promptHash,
  assessLockIntegrity,
  strongestReference,
  type OrchestratorPorts,
  type OrchestrationRequest,
  type RoutableModel,
  type AceShotPlan,
  type ModelRoutingDecision,
} from "@/ace/media-engine";
import type { ProviderResult } from "@/ace/media-engine";

/**
 * Prouve la boucle d'orchestration ACE 0.2 SANS provider payant : les ports
 * (génération, QA, revue, horloge) sont injectés. On vérifie les garanties
 * dures — retry borné, arrêt budgétaire, rejet jamais promu, promotion de la
 * référence approuvée — ainsi que le model router, le premium gate et la
 * direction artistique.
 */

const shot = (id: string, over: Partial<AceShotPlan> = {}): AceShotPlan => ({
  id,
  narrativeRole: "révéler le sujet",
  startState: "large",
  endState: "détail",
  cameraMove: "push-in",
  composition: "centrée",
  focusPoint: "sujet",
  durationS: 4,
  refIn: null,
  refOut: null,
  expectedValidation: "raccord fluide",
  ...over,
});

const routed = (model = "prov/model-a"): ModelRoutingDecision => ({
  provider: "higgsfield",
  model,
  mode: "text2video",
  rationale: "test",
  alternatives: [],
  requiredCapabilities: [],
  blocker: null,
});

function basePorts(over: Partial<OrchestratorPorts> = {}): OrchestratorPorts {
  return {
    generate: () => Promise.resolve({ ok: true, outputs: ["/out/a.mp4"] } as ProviderResult),
    technicalQa: () => ({ verdict: "PASS", issues: [] }),
    now: () => "2026-01-01T00:00:00.000Z",
    ...over,
  };
}

function baseRequest(over: Partial<OrchestrationRequest> = {}): OrchestrationRequest {
  return {
    project: "demo",
    engineVersion: "0.2.0",
    intent: "hero-cinematic",
    qualityBar: "photoreal",
    strategy: "video-scroll",
    shots: [shot("s1")],
    routingFor: () => routed(),
    lock: createReferenceLock("chalet", "un chalet alpin en bois sombre"),
    outDir: "/out",
    budget: createBudget({ maxAttemptsPerShot: 3, currency: "USD" }),
    ...over,
  };
}

describe("Model router — jamais de modèle imaginaire", () => {
  it("refuse de router sans catalogue réel (CATALOG_UNAVAILABLE)", () => {
    const d = routeModel({
      intent: "room-tour",
      qualityBar: "photoreal",
      outputKind: "video",
      hasReferenceImage: false,
      continuityRequired: true,
      catalog: [],
    });
    expect(d.blocker).toBe("CATALOG_UNAVAILABLE");
    expect(d.model).toBeNull();
  });

  it("signale NO_MATCHING_MODEL quand le catalogue ne couvre pas le besoin", () => {
    const catalog: RoutableModel[] = [
      { provider: "p", slug: "img-only", outputType: "image", operationTypes: ["text2image"] },
    ];
    const d = routeModel({
      intent: "room-tour",
      qualityBar: "photoreal",
      outputKind: "video",
      hasReferenceImage: false,
      continuityRequired: true,
      catalog,
    });
    expect(d.blocker).toBe("NO_MATCHING_MODEL");
    expect(d.model).toBeNull();
  });

  it("choisit un modèle réel annonçant le mode exact et expose des alternatives", () => {
    const catalog: RoutableModel[] = [
      { provider: "p", slug: "vid-a", outputType: "video", operationTypes: ["image2video"] },
      { provider: "p", slug: "vid-b", outputType: "video", operationTypes: ["image2video"] },
    ];
    const d = routeModel({
      intent: "room-tour",
      qualityBar: "photoreal",
      outputKind: "video",
      hasReferenceImage: true,
      continuityRequired: true,
      catalog,
    });
    expect(d.blocker).toBeNull();
    expect(d.model).toBe("vid-a");
    expect(d.mode).toBe("image2video");
    expect(d.alternatives).toContain("vid-b");
  });

  it("privilégie image2video dès qu'une référence existe (continuité d'identité)", () => {
    expect(requiredMode({ outputKind: "video", hasReferenceImage: true })).toBe("image2video");
    expect(requiredMode({ outputKind: "video", hasReferenceImage: false })).toBe("text2video");
    expect(requiredMode({ outputKind: "image", hasReferenceImage: true })).toBe("text2image");
  });
});

describe("Premium output gate", () => {
  const assets = {
    continuousVideo: false,
    frameSequence: false,
    stillImages: false,
    realModel3d: false,
    depthMaps: false,
  };

  it("bloque un média corrompu (REJECT technique)", () => {
    const v = evaluatePremiumOutput({
      qualityBar: "photoreal",
      strategy: "video-scroll",
      assets,
      technicalVerdict: "REJECT",
      mediaPresent: true,
    });
    expect(v.action).toBe("BLOCK");
    expect(v.violations).toContain("CORRUPTED_MEDIA");
  });

  it("bloque un asset de test présenté comme livrable", () => {
    const v = evaluatePremiumOutput({
      qualityBar: "photoreal",
      strategy: "video-scroll",
      assets,
      technicalVerdict: "PASS",
      mediaPresent: true,
      isSyntheticTestAsset: true,
    });
    expect(v.action).toBe("BLOCK");
    expect(v.violations).toContain("TEST_ASSET_AS_FINAL");
  });

  it("bloque un verrou d'identité rompu", () => {
    const v = evaluatePremiumOutput({
      qualityBar: "photoreal",
      strategy: "video-scroll",
      assets,
      technicalVerdict: "PASS",
      mediaPresent: true,
      subjectLockIntact: false,
    });
    expect(v.violations).toContain("SUBJECT_LOCK_BROKEN");
  });

  it("exige qu'un repli premium soit DÉCLARÉ, sans casser le site", () => {
    const silent = evaluatePremiumOutput({
      qualityBar: "photoreal",
      strategy: "editorial-fallback",
      assets,
      technicalVerdict: "PASS",
      mediaPresent: true,
    });
    expect(silent.action).toBe("DECLARE_FALLBACK");
    expect(silent.shippableAsPremium).toBe(false);

    const declared = evaluatePremiumOutput({
      qualityBar: "photoreal",
      strategy: "editorial-fallback",
      assets,
      technicalVerdict: "PASS",
      mediaPresent: true,
      fallbackDeclared: true,
    });
    expect(declared.action).toBe("SHIP");
  });
});

describe("Art direction — techniquement valide mais visuellement insuffisant", () => {
  it("n'approuve JAMAIS sans jugement visuel", () => {
    const r = reviewArtDirection({
      shotId: "s1",
      qualityBar: "photoreal",
      technicalVerdict: "PASS",
    });
    expect(r.verdict).toBe("REVIEW_REQUIRED");
    expect(r.requiresHumanReview).toBe(true);
  });

  it("rejette un rendu techniquement valide mais visuellement faible", () => {
    const r = reviewArtDirection({
      shotId: "s1",
      qualityBar: "photoreal",
      technicalVerdict: "PASS",
      source: "human",
      scores: {
        composition: 0.4,
        realism: 0.3,
        brandFit: 0.4,
        continuity: 0.4,
        premiumFeel: 0.3,
        usability: 0.5,
      },
    });
    expect(r.verdict).toBe("REJECT");
  });

  it("rejette dès qu'un axe critique s'effondre, malgré une bonne moyenne", () => {
    const r = reviewArtDirection({
      shotId: "s1",
      qualityBar: "photoreal",
      technicalVerdict: "PASS",
      source: "human",
      scores: {
        composition: 1,
        realism: 1,
        brandFit: 1,
        continuity: 0.2,
        premiumFeel: 1,
        usability: 1,
      },
    });
    expect(r.verdict).toBe("REJECT");
  });
});

describe("Cost control réel", () => {
  it("bloque quand la prochaine génération dépasserait le plafond", () => {
    let b = createBudget({ maxSpend: 10, currency: "USD" });
    b = recordSpend(b, { shotId: "s1", attempt: 1, amount: 8, currency: "USD", source: "est" });
    expect(canGenerate(b, 5).allowed).toBe(false);
    expect(canGenerate(b, 1).allowed).toBe(true);
  });

  it("compte les coûts inconnus comme tels (total = minorant, jamais 0 silencieux)", () => {
    let b = createBudget({ maxSpend: 10, currency: "USD" });
    b = recordSpend(b, { shotId: "s1", attempt: 1, amount: null, currency: "USD", source: "?" });
    const s = summarizeBudget(b);
    expect(s.unknownCostCount).toBe(1);
    expect(s.isLowerBound).toBe(true);
  });
});

describe("Reference lock", () => {
  it("détecte un lock inexploitable (aucune référence, aucun invariant)", () => {
    const lock = createReferenceLock("x", "");
    const r = assessLockIntegrity(lock);
    expect(r.usable).toBe(false);
    expect(r.weaknesses.length).toBeGreaterThan(0);
  });

  it("préfère la dernière sortie approuvée comme référence forte", () => {
    const lock = {
      ...createReferenceLock("chalet", "chalet"),
      sourceReferences: ["/src/ref.jpg"],
      approvedReferences: ["/approved/s1.mp4"],
    };
    expect(strongestReference(lock)).toBe("/approved/s1.mp4");
  });

  it("injecte les invariants dans le prompt du plan", () => {
    const lock = {
      ...createReferenceLock("chalet", "un chalet alpin"),
      invariants: { materials: ["bois brûlé"], timeOfDay: "crépuscule" },
    };
    const p = buildShotPrompt(shot("s1"), lock);
    expect(p).toContain("un chalet alpin");
    expect(p).toContain("bois brûlé");
    expect(p).toContain("crépuscule");
  });
});

describe("Orchestrator — garanties dures", () => {
  it("approuve un plan et le promeut en référence du plan suivant", async () => {
    const res = await orchestrateGeneration(
      baseRequest({ shots: [shot("s1"), shot("s2")] }),
      basePorts(),
    );
    expect(res.outcomes.map((o) => o.outcome)).toEqual(["APPROVED", "APPROVED"]);
    expect(res.lock.approvedReferences).toHaveLength(2);
    // Le 2e plan a bien utilisé la sortie du 1er comme référence.
    expect(res.manifest.entries[1]?.references[0]).toBe("/out/a.mp4");
  });

  it("borne les tentatives (jamais de boucle infinie) et ne promeut pas un rejet", async () => {
    let calls = 0;
    const res = await orchestrateGeneration(
      baseRequest({ budget: createBudget({ maxAttemptsPerShot: 3, currency: "USD" }) }),
      basePorts({
        generate: () => {
          calls += 1;
          return Promise.resolve({ ok: true, outputs: ["/out/bad.mp4"] } as ProviderResult);
        },
        technicalQa: () => ({ verdict: "REJECT", issues: ["corrompu"] }),
      }),
    );
    expect(calls).toBe(3);
    expect(res.outcomes[0]?.outcome).toBe("REJECTED");
    expect(res.manifest.entries[0]?.approved).toBe(false);
    expect(res.manifest.entries[0]?.output).toBeNull();
    expect(res.lock.approvedReferences).toHaveLength(0);
  });

  it("s'arrête net quand le budget est atteint", async () => {
    const res = await orchestrateGeneration(
      baseRequest({
        shots: [shot("s1"), shot("s2"), shot("s3")],
        budget: createBudget({ maxSpend: 10, maxAttemptsPerShot: 1, currency: "USD" }),
      }),
      basePorts({ estimate: () => 6 }),
    );
    expect(res.stoppedEarly).toBe(true);
    expect(res.stopReason).toMatch(/plafond|Budget/i);
    expect(res.outcomes.some((o) => o.outcome === "BLOCKED_BUDGET")).toBe(true);
  });

  it("ne réessaie PAS une erreur d'authentification (inutile et coûteux)", async () => {
    let calls = 0;
    const res = await orchestrateGeneration(
      baseRequest(),
      basePorts({
        generate: () => {
          calls += 1;
          return Promise.resolve({
            ok: false,
            code: "PROVIDER_AUTH_PENDING",
            message: "non authentifié",
          } as ProviderResult);
        },
      }),
    );
    expect(calls).toBe(1);
    expect(res.outcomes[0]?.outcome).toBe("PROVIDER_ERROR");
  });

  it("ne génère rien quand aucun modèle réel n'est disponible", async () => {
    let calls = 0;
    const res = await orchestrateGeneration(
      baseRequest({
        routingFor: () => ({
          provider: null,
          model: null,
          mode: null,
          rationale: "aucun catalogue",
          alternatives: [],
          requiredCapabilities: [],
          blocker: "CATALOG_UNAVAILABLE",
        }),
      }),
      basePorts({
        generate: () => {
          calls += 1;
          return Promise.resolve({ ok: true, outputs: ["/x.mp4"] } as ProviderResult);
        },
      }),
    );
    expect(calls).toBe(0);
    expect(res.outcomes[0]?.outcome).toBe("BLOCKED_NO_MODEL");
  });

  it("classe REVIEW_REQUIRED sans l'approuver (sortie valide, pas une promotion)", async () => {
    const res = await orchestrateGeneration(
      baseRequest({ budget: createBudget({ maxAttemptsPerShot: 1, currency: "USD" }) }),
      basePorts({ technicalQa: () => ({ verdict: "REVIEW_REQUIRED", issues: ["poids élevé"] }) }),
    );
    expect(res.outcomes[0]?.outcome).toBe("NEEDS_REVIEW");
    expect(res.manifest.entries[0]?.approved).toBe(false);
  });

  it("trace la provenance (hash de prompt stable, tentatives, modèle)", async () => {
    const res = await orchestrateGeneration(baseRequest(), basePorts());
    const entry = res.manifest.entries[0];
    expect(entry?.model).toBe("prov/model-a");
    expect(entry?.promptHash).toBe(promptHash(buildShotPrompt(shot("s1"), baseRequest().lock)));
    expect(entry?.attempts).toHaveLength(1);
  });
});

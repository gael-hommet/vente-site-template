import type { AceMediaIntent, AceQualityBar, AceMediaStrategy, AceShotPlan } from "./types";
import type { GenerateRequest, ProviderResult } from "./providers/types";
import type { ModelRoutingDecision } from "./model-router";
import type { AceReferenceLock } from "./reference-lock";
import type { TechnicalVerdict } from "./qa-verdict";
import type { AceArtDirectionReview } from "./art-direction";
import type { AceGenerationAttempt, AceMediaManifest, AceMediaManifestEntry } from "./manifest";
import { promptHash } from "./manifest";
import { lockPromptFragment, negativePromptFragment, strongestReference } from "./reference-lock";
import { canGenerate, recordSpend, type BudgetState } from "./budget";
import { evaluatePremiumOutput } from "./premium-gate";

/**
 * ACE 0.2 — GENERATION ORCHESTRATOR.
 *
 * Implémente la boucle réelle :
 *
 *   PLAN → RESOLVE MODEL → COST CHECK → GENERATE → STORE → MEDIA QA
 *        → ART REVIEW → PREMIUM GATE → ACCEPT/REJECT → RETRY borné → PLAN N+1
 *
 * Conçu avec des PORTS INJECTÉS (génération, estimation, QA, revue, horloge) :
 * la boucle est donc entièrement testable — retries, arrêt budgétaire, rejets,
 * promotion des références — SANS provider payant ni réseau. C'est ce qui
 * permet de prouver le pipeline localement.
 *
 * Garanties :
 *  - jamais de boucle infinie (`maxAttemptsPerShot` borne dure) ;
 *  - arrêt net dès que le budget est atteint ;
 *  - une sortie rejetée n'est JAMAIS promue (elle reste tracée en `rejected`) ;
 *  - un plan accepté devient la référence forte du plan suivant.
 */

/** Ports que l'appelant branche sur le monde réel (ou sur des doubles en test). */
export interface OrchestratorPorts {
  /** Génération réelle (provider). */
  generate: (req: GenerateRequest) => Promise<ProviderResult>;
  /**
   * Coût estimé de la prochaine génération, dans la devise du provider.
   * `null` si le provider ne le communique pas — jamais inventé.
   */
  estimate?: (model: string, params: Record<string, unknown>) => number | null;
  /** QA technique réelle (ffprobe). */
  technicalQa: (file: string) => { verdict: TechnicalVerdict; issues: string[] };
  /** Revue de direction artistique (humaine ou modèle de vision). */
  artReview?: (shot: AceShotPlan, file: string, verdict: TechnicalVerdict) => AceArtDirectionReview;
  /** Horloge injectée (déterminisme en test). */
  now: () => string;
}

export interface OrchestrationRequest {
  project: string;
  engineVersion: string;
  intent: AceMediaIntent;
  qualityBar: AceQualityBar;
  strategy: AceMediaStrategy;
  shots: readonly AceShotPlan[];
  /** Décision de routage par plan (issue du model router, catalogue réel). */
  routingFor: (shot: AceShotPlan) => ModelRoutingDecision;
  lock: AceReferenceLock;
  outDir: string;
  budget: BudgetState;
  /** Devise/valeur affichées dans le manifeste. */
  currency?: string;
}

export type ShotOutcome =
  | "APPROVED"
  | "REJECTED"
  | "NEEDS_REVIEW"
  | "BLOCKED_NO_MODEL"
  | "BLOCKED_BUDGET"
  | "PROVIDER_ERROR";

export interface OrchestrationResult {
  manifest: AceMediaManifest;
  budget: BudgetState;
  /** Lock enrichi des références approuvées (le plan N nourrit le plan N+1). */
  lock: AceReferenceLock;
  outcomes: { shotId: string; outcome: ShotOutcome; detail: string }[];
  /** Le run s'est-il arrêté avant la fin (budget) ? */
  stoppedEarly: boolean;
  stopReason: string | null;
}

/** Construit le prompt d'un plan : rôle narratif + caméra + verrou d'identité. */
export function buildShotPrompt(shot: AceShotPlan, lock: AceReferenceLock): string {
  const identity = lockPromptFragment(lock);
  const beats = [
    shot.narrativeRole,
    `de « ${shot.startState} » vers « ${shot.endState} »`,
    `caméra ${shot.cameraMove}`,
    shot.composition,
    `point d'attention : ${shot.focusPoint}`,
  ]
    .filter(Boolean)
    .join(", ");
  return identity ? `${identity}. ${beats}.` : `${beats}.`;
}

function emptyEntry(
  req: OrchestrationRequest,
  shot: AceShotPlan,
  routing: ModelRoutingDecision,
  prompt: string,
  createdAt: string,
): AceMediaManifestEntry {
  return {
    project: req.project,
    subject: req.lock.subjectId,
    shot: shot.id,
    intent: req.intent,
    qualityBar: req.qualityBar,
    provider: routing.provider,
    model: routing.model,
    mode: routing.mode,
    promptHash: promptHash(prompt),
    references: [],
    createdAt,
    cost: null,
    attempts: [],
    output: null,
    approved: false,
    qa: {
      technicalVerdict: null,
      artDirectionVerdict: null,
      requiresHumanReview: true,
      issues: [],
    },
  };
}

/**
 * Exécute la boucle complète sur l'ensemble des plans.
 * Ne lève jamais : toute anomalie devient un `outcome` traçable.
 */
export async function orchestrateGeneration(
  req: OrchestrationRequest,
  ports: OrchestratorPorts,
): Promise<OrchestrationResult> {
  const currency = req.currency ?? req.budget.limits.currency;
  let budget = req.budget;
  let lock: AceReferenceLock = {
    ...req.lock,
    approvedReferences: [...req.lock.approvedReferences],
  };
  const entries: AceMediaManifestEntry[] = [];
  const outcomes: OrchestrationResult["outcomes"] = [];
  let stoppedEarly = false;
  let stopReason: string | null = null;

  for (const shot of req.shots) {
    if (stoppedEarly) break;

    const routing = req.routingFor(shot);
    const prompt = buildShotPrompt(shot, lock);
    const createdAt = ports.now();
    const entry = emptyEntry(req, shot, routing, prompt, createdAt);

    // 1) Pas de modèle réel ⇒ on ne génère pas. Aucun modèle supposé.
    if (routing.blocker !== null || !routing.model) {
      entry.qa.issues.push(routing.rationale);
      entries.push(entry);
      outcomes.push({
        shotId: shot.id,
        outcome: "BLOCKED_NO_MODEL",
        detail: routing.rationale,
      });
      continue;
    }

    const reference = strongestReference(lock);
    if (reference) entry.references.push(reference);
    const negative = negativePromptFragment(lock);
    const params: Record<string, unknown> = {};
    if (negative) params["negative_prompt"] = negative;

    const maxAttempts = Math.max(1, budget.limits.maxAttemptsPerShot);
    let approvedFile: string | null = null;
    let lastDetail = "";

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      // 2) Contrôle budgétaire AVANT toute dépense.
      const estimated = ports.estimate ? ports.estimate(routing.model, params) : null;
      const decision = canGenerate(budget, estimated);
      if (!decision.allowed) {
        stoppedEarly = true;
        stopReason = decision.message;
        outcomes.push({ shotId: shot.id, outcome: "BLOCKED_BUDGET", detail: decision.message });
        lastDetail = decision.message;
        break;
      }

      // 3) Génération réelle.
      const genReq: GenerateRequest = {
        shot,
        prompt,
        referenceImage: reference ?? undefined,
        outDir: req.outDir,
        model: routing.model,
        params,
      };
      const result = await ports.generate(genReq);
      budget = recordSpend(budget, {
        shotId: shot.id,
        attempt,
        amount: estimated,
        currency,
        source: estimated === null ? "coût non communiqué par le provider" : "estimation provider",
      });

      if (!result.ok) {
        entry.attempts.push({
          attempt,
          errorCode: result.code,
          message: result.message,
          outputs: [],
        });
        lastDetail = `${result.code} — ${result.message}`;
        // Une erreur de configuration/auth ne se corrige pas en réessayant.
        if (
          result.code === "PROVIDER_NOT_CONFIGURED" ||
          result.code === "PROVIDER_AUTH_PENDING" ||
          result.code === "PROVIDER_CONTRACT_UNVERIFIED"
        ) {
          break;
        }
        continue;
      }

      const file = result.outputs[0];
      if (!file) {
        entry.attempts.push({
          attempt,
          errorCode: "GENERATION_FAILED",
          message: "Le provider a répondu sans fichier exploitable.",
          outputs: [],
        });
        lastDetail = "Aucune sortie exploitable.";
        continue;
      }

      // 4) QA technique réelle sur le fichier produit.
      const tech = ports.technicalQa(file);
      const art = ports.artReview?.(shot, file, tech.verdict);
      const attemptRecord: AceGenerationAttempt = {
        attempt,
        errorCode: null,
        outputs: result.outputs,
        technicalVerdict: tech.verdict,
      };

      // 5) Premium gate : le média peut-il porter l'ambition ?
      const gate = evaluatePremiumOutput({
        qualityBar: req.qualityBar,
        strategy: req.strategy,
        assets: {
          continuousVideo: false,
          frameSequence: false,
          stillImages: false,
          realModel3d: false,
          depthMaps: false,
        },
        technicalVerdict: tech.verdict,
        mediaPresent: true,
        fallbackDeclared: true,
      });

      const artOk = !art || art.verdict === "APPROVE";
      const techOk = tech.verdict === "PASS";
      const accepted = techOk && artOk && gate.action !== "BLOCK";

      entry.qa.technicalVerdict = tech.verdict;
      entry.qa.artDirectionVerdict = art?.verdict ?? null;
      entry.qa.requiresHumanReview = art?.requiresHumanReview ?? true;
      entry.qa.issues = [...tech.issues, ...(art?.reasons ?? []), ...gate.reasons];

      if (accepted) {
        attemptRecord.rejectedFor = undefined;
        entry.attempts.push(attemptRecord);
        approvedFile = file;
        break;
      }

      attemptRecord.rejectedFor = [
        ...tech.issues,
        ...(art && art.verdict !== "APPROVE" ? [`art: ${art.verdict}`] : []),
        ...(gate.action === "BLOCK" ? gate.violations : []),
      ];
      entry.attempts.push(attemptRecord);
      lastDetail =
        tech.verdict === "REJECT"
          ? "QA technique : rejet."
          : art && art.verdict !== "APPROVE"
            ? `Direction artistique : ${art.verdict}.`
            : "Rejeté par le premium gate.";
    }

    if (approvedFile) {
      entry.output = approvedFile;
      entry.approved = true;
      // Le plan approuvé devient la référence forte du plan suivant.
      lock = { ...lock, approvedReferences: [...lock.approvedReferences, approvedFile] };
      outcomes.push({ shotId: shot.id, outcome: "APPROVED", detail: approvedFile });
    } else if (!stoppedEarly) {
      const producedSomething = entry.attempts.some((a) => a.outputs.length > 0);
      const needsReview = entry.qa.technicalVerdict === "REVIEW_REQUIRED";
      const outcome: ShotOutcome = producedSomething
        ? needsReview
          ? "NEEDS_REVIEW"
          : "REJECTED"
        : "PROVIDER_ERROR";
      outcomes.push({ shotId: shot.id, outcome, detail: lastDetail || "Aucune sortie approuvée." });
    }

    entries.push(entry);
  }

  return {
    manifest: {
      engine: "Aurexia Cinematic Engine",
      engineVersion: req.engineVersion,
      project: req.project,
      generatedAt: ports.now(),
      entries,
    },
    budget,
    lock,
    outcomes,
    stoppedEarly,
    stopReason,
  };
}

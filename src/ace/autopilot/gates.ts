import type { AutopilotMission, BlockedReason, FactRegistry } from "./types";
import type { AutopilotPolicy } from "@/config/ace-autopilot-policy";
import { AUTOPILOT_POLICY } from "@/config/ace-autopilot-policy";

/**
 * ACE AUTOPILOT — garde-fous (purs, testables).
 *
 * Chaque gate répond à une seule question : « a-t-on le droit de continuer ? ».
 * Un gate ne corrige rien et ne contourne rien : il autorise, ou il bloque avec
 * une raison lisible. C'est ce qui empêche AUTOPILOT de « se débrouiller » en
 * dégradant silencieusement le résultat.
 */

export interface GateResult {
  pass: boolean;
  reason: BlockedReason | null;
  /** Message court, destiné à un utilisateur non technique. */
  message: string;
  /** Détail technique, réservé au rapport interne. */
  detail?: string;
}

const OK: GateResult = { pass: true, reason: null, message: "OK" };

/** L'environnement permet-il de produire un site ? (résultat de `ace:doctor`) */
export function environmentGate(doctor: {
  canBuildSites: boolean;
  canGenerateMedia: boolean;
}): GateResult {
  if (!doctor.canBuildSites) {
    return {
      pass: false,
      reason: "ENVIRONMENT_NOT_READY",
      message:
        "L'environnement n'est pas prêt. Lancez « pnpm ace:doctor » pour voir quoi corriger.",
    };
  }
  return OK;
}

/**
 * Le provider média est-il requis, et disponible ?
 *
 * C'est LE gate anti-médiocrité : sans provider, on ne fabrique jamais une
 * fausse version low-poly. Soit on produit un site éditorial premium assumé,
 * soit on bloque en disant exactement ce que l'ADMIN doit faire.
 */
export function providerGate(input: {
  mediaRequired: boolean;
  providerAuthenticated: boolean;
  policy?: AutopilotPolicy;
}): GateResult {
  const policy = input.policy ?? AUTOPILOT_POLICY;
  if (!input.mediaRequired || input.providerAuthenticated) return OK;

  if (policy.provider.whenUnavailable === "editorial-only") {
    return {
      pass: true,
      reason: null,
      message:
        "Aucun générateur d'images n'est activé : le site sera produit en version éditoriale premium (assumée).",
    };
  }
  return {
    pass: false,
    reason: "ADMIN_PROVIDER_AUTH_REQUIRED",
    message:
      "Ce site a besoin de visuels sur mesure. L'administrateur doit activer le générateur d'images " +
      "(une seule fois) — voir docs/ACE-ADMIN-SETUP.md.",
    detail: "hf-api non authentifié ; aucune substitution low-poly n'est produite.",
  };
}

/**
 * La dépense prévue est-elle autorisée sans demander ?
 * Un coût inconnu n'est jamais traité comme gratuit : il demande un accord.
 */
export function spendGate(input: {
  estimatedTotal: number | null;
  currency: string;
  approved?: boolean;
  policy?: AutopilotPolicy;
}): GateResult {
  const policy = input.policy ?? AUTOPILOT_POLICY;
  const { estimatedTotal, currency } = input;

  if (estimatedTotal !== null && estimatedTotal > policy.spend.hardCap) {
    return {
      pass: false,
      reason: "SPEND_APPROVAL_REQUIRED",
      message:
        `Le coût estimé (${String(estimatedTotal)} ${currency}) dépasse le plafond absolu ` +
        `(${String(policy.spend.hardCap)} ${currency}). La mission s'arrête ici par sécurité.`,
    };
  }
  if (input.approved === true) return OK;

  if (estimatedTotal === null) {
    return {
      pass: false,
      reason: "SPEND_APPROVAL_REQUIRED",
      message:
        "Le coût de production des visuels n'est pas communiqué par le fournisseur. " +
        "Votre accord est nécessaire avant de lancer.",
    };
  }
  if (estimatedTotal > policy.spend.approvalThreshold) {
    return {
      pass: false,
      reason: "SPEND_APPROVAL_REQUIRED",
      message: `Cette production coûtera environ ${String(estimatedTotal)} ${currency}. Continuer ?`,
    };
  }
  return OK;
}

/** Informations réellement indispensables pour produire un site honnête. */
const ESSENTIAL_FACT_KEYS = ["businessName"] as const;

/**
 * A-t-on le minimum vital ? Volontairement MINIMAL : tout le reste devient
 * `[À CONFIRMER]` plutôt que de bloquer l'utilisateur avec un questionnaire.
 */
export function factsGate(facts: FactRegistry): GateResult {
  const have = new Set(facts.facts.map((f) => f.key));
  const missing = ESSENTIAL_FACT_KEYS.filter((k) => !have.has(k));
  if (missing.length === 0) return OK;
  return {
    pass: false,
    reason: "MISSING_ESSENTIAL_INFO",
    message:
      "Je n'ai pas réussi à identifier l'entreprise. Pouvez-vous me donner son nom exact " +
      "(ou l'adresse de son site / de sa page) ?",
    detail: `Faits essentiels manquants : ${missing.join(", ")}`,
  };
}

/**
 * Aucun fait ne doit exister sans source : c'est la garantie « rien d'inventé ».
 * Retourne la liste des faits fautifs (vide si tout va bien).
 */
export function unsourcedFacts(facts: FactRegistry): string[] {
  return facts.facts.filter((f) => !f.source.trim()).map((f) => f.key);
}

/** La barre de qualité est-elle atteinte, ou peut-on encore itérer ? */
export function qualityGate(input: {
  score: number | null;
  iterationsDone: number;
  policy?: AutopilotPolicy;
}): GateResult {
  const policy = input.policy ?? AUTOPILOT_POLICY;
  const { score, iterationsDone } = input;

  if (score !== null && score >= policy.quality.minScore) return OK;

  if (iterationsDone < policy.quality.maxVisualIterations) {
    return {
      pass: false,
      reason: null,
      message: "Le rendu n'est pas encore au niveau : nouvelle passe d'amélioration.",
      detail: `score=${String(score)} < ${String(policy.quality.minScore)}, itération ${String(iterationsDone + 1)}`,
    };
  }
  return {
    pass: false,
    reason: "QUALITY_NOT_REACHED",
    message:
      "Après plusieurs améliorations, le rendu n'atteint pas le niveau attendu. " +
      "Je préfère vous le dire plutôt que de livrer un site moyen.",
    detail: `score=${String(score)} après ${String(iterationsDone)} itérations`,
  };
}

/** Le déploiement n'est JAMAIS automatique — ce gate refuse toujours. */
export function deploymentGate(): GateResult {
  return {
    pass: false,
    reason: null,
    message:
      "Aucune publication n'a été faite. Le site reste local : c'est vous qui décidez quand le publier.",
  };
}

/** Applique les gates dans l'ordre et renvoie le premier échec. */
export function firstFailure(results: readonly GateResult[]): GateResult | null {
  return results.find((r) => !r.pass) ?? null;
}

/** Résumé des dépenses de la mission, pour le rapport. */
export function spendSummary(mission: AutopilotMission): string {
  const { amount, currency, isLowerBound } = mission.spend;
  if (amount === 0) return "aucune dépense";
  return `${String(amount)} ${currency}${isLowerBound ? " (au moins)" : ""}`;
}

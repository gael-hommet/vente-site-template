import type { BlockedReason, FactRegistry } from "./types";
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
 * Y a-t-il assez de MATIÈRE VISUELLE réelle pour l'ambition demandée ?
 *
 * ACE ne génère aucun média : si un parti-pris porté par l'image est retenu mais
 * qu'aucun visuel réel n'existe, on ne bricole pas — on demande le média, ou on
 * bascule sur un parti-pris éditorial assumé.
 */
export function assetGate(input: {
  imageLedDirection: boolean;
  hasVisualMaterial: boolean;
  policy?: AutopilotPolicy;
}): GateResult {
  const policy = input.policy ?? AUTOPILOT_POLICY;
  if (!input.imageLedDirection || input.hasVisualMaterial) return OK;

  if (policy.assets.whenNoVisual === "editorial-fallback") {
    return {
      pass: true,
      reason: null,
      message:
        "Aucun visuel exploitable trouvé : le site sera construit en parti-pris éditorial premium (assumé).",
    };
  }
  return {
    pass: false,
    reason: "MEDIA_ASSET_REQUIRED",
    message:
      "Je n'ai trouvé aucun visuel utilisable pour cette entreprise. " +
      "Pouvez-vous m'envoyer une ou deux photos (ou l'adresse d'une page où elles sont publiées) ?",
    detail: "aucun média réel ; aucune génération n'est tentée (coût média = 0 €).",
  };
}

/**
 * Les droits permettent-ils ce contexte d'usage ?
 * Une démo privée tolère les médias officiels publics (provenance conservée) ;
 * une mise en production exige des droits confirmés.
 */
export function rightsGate(input: {
  usage: "PRIVATE_DEMO" | "PRODUCTION";
  unconfirmed: string[];
}): GateResult {
  if (input.usage === "PRIVATE_DEMO" || input.unconfirmed.length === 0) return OK;
  return {
    pass: false,
    reason: "MEDIA_RIGHTS_UNCONFIRMED",
    message:
      "Avant de publier ce site, les droits d'utilisation de certains visuels doivent être " +
      "confirmés par l'entreprise.",
    detail: input.unconfirmed.join(" · "),
  };
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

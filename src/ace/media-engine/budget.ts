/**
 * ACE 0.2 — COST CONTROL RÉEL (budget consommé, pas seulement estimé).
 *
 * `cost.ts` estime AVANT (combien cela devrait coûter). Ce module suit ce qui a
 * été RÉELLEMENT consommé pendant un run et arrête la boucle quand le plafond
 * est atteint — c'est le garde-fou qui empêche une boucle de retry de brûler un
 * budget.
 *
 * HONNÊTETÉ : un coût n'est enregistré que s'il provient d'une source
 * vérifiable (l'estimation du provider via `hf-api estimate`, ou sa
 * consommation réelle via `hf-api usage`). ACE n'invente jamais un montant ;
 * un coût inconnu est `null` et signalé comme tel, jamais compté comme 0 en
 * silence.
 */

export interface BudgetLimits {
  /** Plafond de dépense pour ce run (devise du provider). */
  maxSpend: number | null;
  /** Tentatives maximum par plan (borne dure anti-boucle infinie). */
  maxAttemptsPerShot: number;
  /** Nombre total de générations autorisées sur le run. */
  maxTotalGenerations: number | null;
  currency: string;
}

/** Défauts volontairement prudents. */
export const DEFAULT_BUDGET_LIMITS: BudgetLimits = {
  maxSpend: null,
  maxAttemptsPerShot: 3,
  maxTotalGenerations: null,
  currency: "—",
};

export interface SpendRecord {
  shotId: string;
  attempt: number;
  /** null = coût non communiqué par le provider (jamais supposé nul). */
  amount: number | null;
  currency: string;
  /** D'où vient ce montant (ex. « hf-api estimate », « hf-api usage »). */
  source: string;
}

export interface BudgetState {
  limits: BudgetLimits;
  records: SpendRecord[];
  /** Somme des montants CONNUS. */
  spent: number;
  /** Nombre de coûts inconnus (transparence : le total est un minorant). */
  unknownCostCount: number;
  generations: number;
}

export function createBudget(limits: Partial<BudgetLimits> = {}): BudgetState {
  return {
    limits: { ...DEFAULT_BUDGET_LIMITS, ...limits },
    records: [],
    spent: 0,
    unknownCostCount: 0,
    generations: 0,
  };
}

/** Enregistre une dépense (ou une dépense inconnue) et incrémente le compteur. */
export function recordSpend(state: BudgetState, record: SpendRecord): BudgetState {
  const records = [...state.records, record];
  return {
    ...state,
    records,
    spent: record.amount === null ? state.spent : Number((state.spent + record.amount).toFixed(4)),
    unknownCostCount: state.unknownCostCount + (record.amount === null ? 1 : 0),
    generations: state.generations + 1,
  };
}

export type BudgetStopReason =
  "MAX_SPEND_REACHED" | "MAX_GENERATIONS_REACHED" | "WOULD_EXCEED_MAX_SPEND";

export interface BudgetDecision {
  allowed: boolean;
  reason: BudgetStopReason | null;
  message: string;
}

/**
 * Autorise (ou non) une génération supplémentaire.
 * `nextCost` est l'estimation du provider pour la prochaine génération ; si
 * elle est inconnue, on n'invente pas — on autorise mais on le signale.
 */
export function canGenerate(state: BudgetState, nextCost: number | null): BudgetDecision {
  const { maxSpend, maxTotalGenerations, currency } = state.limits;

  if (maxTotalGenerations !== null && state.generations >= maxTotalGenerations) {
    return {
      allowed: false,
      reason: "MAX_GENERATIONS_REACHED",
      message: `Plafond de générations atteint (${String(maxTotalGenerations)}). Arrêt volontaire.`,
    };
  }
  if (maxSpend !== null) {
    if (state.spent >= maxSpend) {
      return {
        allowed: false,
        reason: "MAX_SPEND_REACHED",
        message: `Budget épuisé : ${String(state.spent)} ${currency} ≥ plafond ${String(maxSpend)} ${currency}.`,
      };
    }
    if (nextCost !== null && state.spent + nextCost > maxSpend) {
      return {
        allowed: false,
        reason: "WOULD_EXCEED_MAX_SPEND",
        message:
          `La prochaine génération (${String(nextCost)} ${currency}) dépasserait le plafond ` +
          `(${String(state.spent)} + ${String(nextCost)} > ${String(maxSpend)} ${currency}).`,
      };
    }
  }
  return {
    allowed: true,
    reason: null,
    message:
      nextCost === null
        ? "Autorisé — coût de la prochaine génération inconnu (non communiqué par le provider)."
        : `Autorisé — coût estimé ${String(nextCost)} ${currency}.`,
  };
}

/** Reste disponible (null si aucun plafond défini). */
export function remainingBudget(state: BudgetState): number | null {
  if (state.limits.maxSpend === null) return null;
  return Number((state.limits.maxSpend - state.spent).toFixed(4));
}

export interface BudgetSummary {
  spent: number;
  remaining: number | null;
  currency: string;
  generations: number;
  unknownCostCount: number;
  perShot: { shotId: string; amount: number | null; attempts: number }[];
  /** Le total est-il un minorant (des coûts manquent) ? */
  isLowerBound: boolean;
}

/** Rapport de dépense, honnête sur ce qui n'est pas chiffré. */
export function summarizeBudget(state: BudgetState): BudgetSummary {
  const byShot = new Map<string, { amount: number | null; attempts: number }>();
  for (const r of state.records) {
    const cur = byShot.get(r.shotId) ?? { amount: null, attempts: 0 };
    const amount =
      r.amount === null ? cur.amount : Number(((cur.amount ?? 0) + r.amount).toFixed(4));
    byShot.set(r.shotId, { amount, attempts: cur.attempts + 1 });
  }
  return {
    spent: state.spent,
    remaining: remainingBudget(state),
    currency: state.limits.currency,
    generations: state.generations,
    unknownCostCount: state.unknownCostCount,
    perShot: [...byShot.entries()].map(([shotId, v]) => ({ shotId, ...v })),
    isLowerBound: state.unknownCostCount > 0,
  };
}

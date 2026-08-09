import type { AutopilotMission, AutopilotState, BlockedReason } from "./types";
import { TERMINAL_STATES } from "./types";

/**
 * ACE AUTOPILOT — machine à états (pure, testable).
 *
 * Chaque transition est explicite : on ne « saute » jamais une étape par
 * accident. La persistance de cet objet est ce qui permet de reprendre une
 * mission après une coupure de session sans repartir de zéro.
 */

/** Enchaînement nominal. */
const NEXT: Record<AutopilotState, AutopilotState | null> = {
  INTAKE: "RESEARCH",
  RESEARCH: "FACT_CHECK",
  FACT_CHECK: "SITE_BOOTSTRAP",
  SITE_BOOTSTRAP: "ART_DIRECTION",
  ART_DIRECTION: "CONTENT",
  CONTENT: "MEDIA_PLAN",
  MEDIA_PLAN: "MEDIA_GENERATION",
  MEDIA_GENERATION: "MEDIA_QA",
  MEDIA_QA: "SITE_BUILD",
  SITE_BUILD: "VISUAL_QA",
  VISUAL_QA: "MOBILE_QA",
  MOBILE_QA: "TECHNICAL_QA",
  TECHNICAL_QA: "PREVIEW",
  PREVIEW: "COMPLETE",
  COMPLETE: null,
  BLOCKED: null,
  WAITING_FOR_APPROVAL: null,
};

/** État suivant dans le workflow nominal (null si terminal). */
export function nextState(state: AutopilotState): AutopilotState | null {
  return NEXT[state];
}

export function isTerminal(state: AutopilotState): boolean {
  return TERMINAL_STATES.includes(state);
}

/** Progression 0..1 (indicative, pour l'affichage utilisateur). */
export function progressOf(state: AutopilotState): number {
  if (state === "COMPLETE") return 1;
  if (isTerminal(state)) {
    // Un blocage n'est pas une progression : on renvoie l'avancement atteint.
    return 0;
  }
  const order: AutopilotState[] = [
    "INTAKE",
    "RESEARCH",
    "FACT_CHECK",
    "SITE_BOOTSTRAP",
    "ART_DIRECTION",
    "CONTENT",
    "MEDIA_PLAN",
    "MEDIA_GENERATION",
    "MEDIA_QA",
    "SITE_BUILD",
    "VISUAL_QA",
    "MOBILE_QA",
    "TECHNICAL_QA",
    "PREVIEW",
  ];
  const i = order.indexOf(state);
  return i < 0 ? 0 : Number((i / order.length).toFixed(2));
}

/** Libellés courts, compréhensibles sans compétence technique. */
const HUMAN_LABELS: Record<AutopilotState, string> = {
  INTAKE: "Analyse de votre demande",
  RESEARCH: "Recherche d'informations sur l'entreprise",
  FACT_CHECK: "Vérification des informations",
  SITE_BOOTSTRAP: "Création du projet",
  ART_DIRECTION: "Choix de la direction artistique",
  CONTENT: "Rédaction des textes",
  MEDIA_PLAN: "Conception des visuels",
  MEDIA_GENERATION: "Production des visuels",
  MEDIA_QA: "Contrôle des visuels",
  SITE_BUILD: "Construction du site",
  VISUAL_QA: "Relecture visuelle (ordinateur)",
  MOBILE_QA: "Relecture visuelle (mobile)",
  TECHNICAL_QA: "Vérifications techniques",
  PREVIEW: "Ouverture de l'aperçu",
  COMPLETE: "Terminé",
  BLOCKED: "En attente d'une action",
  WAITING_FOR_APPROVAL: "En attente de votre accord",
};

export function humanLabel(state: AutopilotState): string {
  return HUMAN_LABELS[state];
}

/** Message utilisateur pour chaque cause de blocage (jamais un log brut). */
const BLOCKED_MESSAGES: Record<BlockedReason, string> = {
  ADMIN_PROVIDER_AUTH_REQUIRED:
    "La génération d'images/vidéos nécessite une activation par l'administrateur (une seule fois).",
  MISSING_ESSENTIAL_INFO:
    "Une information indispensable est introuvable publiquement et ne peut pas être devinée.",
  MEDIA_ASSET_REQUIRED:
    "Un visuel de qualité professionnelle est nécessaire et ne peut pas être produit ici.",
  SPEND_APPROVAL_REQUIRED:
    "Cette production a un coût : votre accord est nécessaire pour continuer.",
  ENVIRONMENT_NOT_READY: "L'environnement n'est pas prêt (lancez « ace:doctor » pour le détail).",
  QUALITY_NOT_REACHED:
    "Le résultat n'atteint pas encore le niveau attendu après plusieurs tentatives.",
  UNRECOVERABLE_ERROR: "Une erreur technique empêche de continuer automatiquement.",
};

export function blockedMessageFor(reason: BlockedReason): string {
  return BLOCKED_MESSAGES[reason];
}

/** Crée une mission neuve. `now` est injecté (déterminisme en test). */
export function createMission(input: {
  id: string;
  brief: string;
  intent: AutopilotMission["intent"];
  slug: string;
  now: string;
}): AutopilotMission {
  return {
    id: input.id,
    schemaVersion: 1,
    brief: input.brief,
    intent: input.intent,
    slug: input.slug,
    targetDir: null,
    content: null,
    providedAssets: [],
    assetsDir: null,
    state: "INTAKE",
    blockedReason: null,
    blockedMessage: null,
    facts: { facts: [], notFound: [] },
    artDirection: null,
    mediaManifestPath: null,
    iterations: [],
    steps: [],
    spend: { amount: 0, currency: "—", isLowerBound: false },
    previewUrl: null,
    createdAt: input.now,
    updatedAt: input.now,
  };
}

/** Avance d'un état (sans rien sauter). Ne fait rien si la mission est terminale. */
export function advance(mission: AutopilotMission, now: string): AutopilotMission {
  if (isTerminal(mission.state)) return mission;
  const next = nextState(mission.state);
  if (!next) return mission;
  return { ...mission, state: next, updatedAt: now };
}

/** Bloque la mission avec une raison explicite et un message lisible. */
export function block(
  mission: AutopilotMission,
  reason: BlockedReason,
  now: string,
  detail?: string,
): AutopilotMission {
  return {
    ...mission,
    state: reason === "SPEND_APPROVAL_REQUIRED" ? "WAITING_FOR_APPROVAL" : "BLOCKED",
    blockedReason: reason,
    blockedMessage: detail ? `${blockedMessageFor(reason)} ${detail}` : blockedMessageFor(reason),
    updatedAt: now,
  };
}

/**
 * Reprend une mission bloquée : on repart de l'état bloquant, pas du début.
 * Le blocage est effacé — la cause est supposée levée par l'appelant.
 */
export function unblock(
  mission: AutopilotMission,
  resumeAt: AutopilotState,
  now: string,
): AutopilotMission {
  return {
    ...mission,
    state: resumeAt,
    blockedReason: null,
    blockedMessage: null,
    updatedAt: now,
  };
}

/**
 * Dernier état RÉUSSI, d'après l'historique des étapes.
 * C'est le point de reprise après une interruption brutale (session tuée) :
 * on ne refait pas ce qui a été validé.
 */
export function lastCompletedState(mission: AutopilotMission): AutopilotState | null {
  const done = mission.steps.filter((s) => s.ok && s.endedAt !== null);
  return done.length > 0 ? (done[done.length - 1]?.state ?? null) : null;
}

/** État depuis lequel reprendre une mission interrompue. */
export function resumeState(mission: AutopilotMission): AutopilotState {
  // Un blocage explicite reste le point de reprise (sa cause doit être levée).
  if (mission.state === "BLOCKED" || mission.state === "WAITING_FOR_APPROVAL") {
    const last = lastCompletedState(mission);
    return last ? (nextState(last) ?? mission.state) : "INTAKE";
  }
  const last = lastCompletedState(mission);
  if (!last) return mission.state;
  // Si une étape est enregistrée comme réussie, on repart de la SUIVANTE.
  return nextState(last) ?? mission.state;
}

/** Ouvre une étape (trace de ce qui est fait, et par quelles commandes). */
export function beginStep(
  mission: AutopilotMission,
  state: AutopilotState,
  now: string,
): AutopilotMission {
  return {
    ...mission,
    steps: [
      ...mission.steps,
      { state, startedAt: now, endedAt: null, ok: false, commands: [], notes: [] },
    ],
    updatedAt: now,
  };
}

/** Clôt l'étape courante. */
export function endStep(
  mission: AutopilotMission,
  result: { ok: boolean; commands?: string[]; notes?: string[] },
  now: string,
): AutopilotMission {
  const steps = [...mission.steps];
  for (let i = steps.length - 1; i >= 0; i -= 1) {
    const step = steps[i];
    if (step && step.endedAt === null) {
      steps[i] = {
        ...step,
        endedAt: now,
        ok: result.ok,
        commands: [...step.commands, ...(result.commands ?? [])],
        notes: [...step.notes, ...(result.notes ?? [])],
      };
      break;
    }
  }
  return { ...mission, steps, updatedAt: now };
}

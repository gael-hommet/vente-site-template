/**
 * ACE AUTOPILOT — barrel (isomorphe, aucun `node:*`).
 *
 * Couche qui rend ACE pilotable en une phrase par une personne non technique.
 * Elle ORCHESTRE l'existant (générateur, media-engine, providers, tests) : elle
 * ne le remplace pas. Voir docs/ACE-AUTOPILOT.md.
 */

export type {
  AutopilotState,
  AutopilotIntent,
  AutopilotMission,
  AgentRequest,
  ArtDirection,
  BlockedReason,
  FactRegistry,
  VerifiedFact,
  MissionStep,
  QualityIteration,
  SiteContentDraft,
} from "./types";
export { AUTOPILOT_STATES, TERMINAL_STATES } from "./types";

export {
  detectIntent,
  missionSlug,
  slugify,
  extractUrl,
  extractBusinessName,
  detectIndustry,
} from "./intent";

export {
  createMission,
  advance,
  block,
  unblock,
  beginStep,
  endStep,
  nextState,
  isTerminal,
  progressOf,
  humanLabel,
  blockedMessageFor,
  lastCompletedState,
  resumeState,
} from "./state";

export {
  environmentGate,
  providerGate,
  spendGate,
  factsGate,
  qualityGate,
  deploymentGate,
  unsourcedFacts,
  firstFailure,
  spendSummary,
  type GateResult,
} from "./gates";

export { decideArtDirection, requiresGeneratedMedia, PROFILED_SECTORS } from "./art-direction";

export { userReport, technicalReport, statusLine } from "./report";

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
  SpatialStrategyRecord,
  StageReport,
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
  assetGate,
  rightsGate,
  factsGate,
  qualityGate,
  deploymentGate,
  unsourcedFacts,
  firstFailure,
  type GateResult,
} from "./gates";

export { decideArtDirection, requiresGeneratedMedia, PROFILED_SECTORS } from "./art-direction";

export {
  decideSpatialStrategy,
  explainSpatialDecision,
  spatialCandidates,
  depthMapFor,
  hasRealModel,
  isDepthMapPath,
  type AutopilotSpatialDecision,
} from "./spatial-decision";

export { userReport, technicalReport, statusLine } from "./report";

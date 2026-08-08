/**
 * ACE 0.2 — Creative Media Autonomous Engine (barrel).
 *
 * Couche qui DÉCIDE, PLANIFIE et CONTRÔLE les médias premium (elle ne rend rien
 * elle-même). Voir docs/ACE-MEDIA-ARCHITECTURE.md. Doctrine anti-low-poly :
 * jamais de substitution procédurale cheap comme sortie premium.
 */

export type {
  AceMediaIntent,
  AceMediaStrategy,
  AceQualityBar,
  AceAvailableAssets,
  AceCapabilityReport,
  AceMediaConstraints,
  AceStrategyDecision,
  AceShotPlan,
  AceMediaPlan,
  AceProviderPricing,
  AceCostEstimate,
  AceMediaQaScores,
  AceMediaQaReport,
  AceContinuityReport,
} from "./types";

export { chooseStrategy, type ChooseStrategyInput } from "./strategy";
export { buildShotPlan } from "./shot-planner";
export { buildMediaPlan, type MediaBriefInput } from "./plan";
export { estimateCost, type CostGuardInput } from "./cost";
export { assessMedia, assessContinuity, structuralIssues, QA_ACCEPT_THRESHOLD } from "./qa";
export {
  evaluateLowPolyRisk,
  assertNoLowPolySubstitution,
  type LowPolyVerdict,
} from "./anti-low-poly";

export {
  isProviderConfigured,
  configuredProviders,
  unconfiguredProviders,
  KNOWN_PROVIDERS,
  type ProviderEnvSpec,
} from "./config";

export { allProviders, getProvider, readyProviders, providersFor } from "./providers/registry";
export type {
  MediaProvider,
  ProviderCapability,
  ProviderStatus,
  ProviderResult,
  GenerateRequest,
} from "./providers/types";

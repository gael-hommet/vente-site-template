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

export type { TechnicalVerdict } from "./qa-verdict";
export { TECHNICAL_VERDICTS } from "./qa-verdict";

export {
  routeModel,
  requiredMode,
  outputKindForShot,
  routingNeedsHumanValidation,
  CONTINUITY_CRITICAL_INTENTS,
  type RoutableModel,
  type GenerationMode,
  type ModelRoutingInput,
  type ModelRoutingDecision,
  type ModelRoutingBlocker,
} from "./model-router";

export {
  createReferenceLock,
  strongestReference,
  lockPromptFragment,
  negativePromptFragment,
  assessLockIntegrity,
  type AceReferenceLock,
  type LockIntegrityReport,
} from "./reference-lock";

export {
  evaluatePremiumOutput,
  assertPremiumOutput,
  type PremiumViolation,
  type PremiumGateInput,
  type PremiumGateVerdict,
} from "./premium-gate";

export {
  reviewArtDirection,
  ART_APPROVE_THRESHOLD,
  ART_REJECT_THRESHOLD,
  type AceArtDirectionScores,
  type AceArtDirectionReview,
  type ArtDirectionVerdict,
  type ArtDirectionInput,
} from "./art-direction";

export {
  createBudget,
  recordSpend,
  canGenerate,
  remainingBudget,
  summarizeBudget,
  DEFAULT_BUDGET_LIMITS,
  type BudgetLimits,
  type BudgetState,
  type SpendRecord,
  type BudgetDecision,
  type BudgetSummary,
} from "./budget";

export {
  promptHash,
  emptyManifest,
  summarizeManifest,
  type AceMediaManifest,
  type AceMediaManifestEntry,
  type AceGenerationAttempt,
} from "./manifest";

export {
  orchestrateGeneration,
  buildShotPrompt,
  type OrchestratorPorts,
  type OrchestrationRequest,
  type OrchestrationResult,
  type ShotOutcome,
} from "./orchestrator";

export {
  chooseDeliveryMode,
  SEQUENCE_MAX_WEIGHT_KB,
  SEQUENCE_MAX_FRAMES,
  type DeliveryMode,
  type DeliveryModeInput,
  type DeliveryModeDecision,
} from "./delivery-mode";

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
  isProviderEnvConfigured,
  configuredProviders,
  unconfiguredProviders,
  KNOWN_PROVIDERS,
  type ProviderEnvSpec,
} from "./config";

export {
  setHiggsfieldRuntime,
  resetHiggsfieldRuntime,
  type HiggsfieldRuntime,
} from "./providers/higgsfield";
export { setLocalToolAvailability } from "./providers/local";

export { allProviders, getProvider, readyProviders, providersFor } from "./providers/registry";
export type {
  MediaProvider,
  ProviderCapability,
  ProviderStatus,
  ProviderResult,
  GenerateRequest,
} from "./providers/types";

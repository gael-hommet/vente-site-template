/**
 * ACE — Creative Media Engine (barrel).
 *
 * Couche qui DÉCIDE, PLANIFIE et CONTRÔLE les médias premium à partir du
 * matériau RÉEL disponible. **Aucune génération d'image ou de vidéo via un
 * service payant** : le coût média d'un site ACE est de 0 €.
 *
 * Voir docs/ACE-MEDIA-ARCHITECTURE.md et docs/ACE-ASSET-SOURCES.md.
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
  AceMediaQaScores,
  AceMediaQaReport,
  AceContinuityReport,
} from "./types";

export type { TechnicalVerdict } from "./qa-verdict";
export { TECHNICAL_VERDICTS } from "./qa-verdict";

export {
  ASSET_SOURCE_KINDS,
  sourcePriority,
  validateInventory,
  usableAssets,
  bestAssetFor,
  hasVisualMaterial,
  provenanceDisclosure,
  productionBlockers,
  type AssetSourceKind,
  type AssetNature,
  type AssetRole,
  type AssetRights,
  type UsageContext,
  type AssetRecord,
  type AssetInventory,
  type AssetIssue,
} from "./asset-source";

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
  promptHash,
  emptyManifest,
  summarizeManifest,
  type AceMediaManifest,
  type AceMediaManifestEntry,
  type AceGenerationAttempt,
} from "./manifest";

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
export { assessMedia, assessContinuity, structuralIssues, QA_ACCEPT_THRESHOLD } from "./qa";
export {
  evaluateLowPolyRisk,
  assertNoLowPolySubstitution,
  type LowPolyVerdict,
} from "./anti-low-poly";

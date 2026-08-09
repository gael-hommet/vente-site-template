import type { AceMediaIntent, AceQualityBar, AceShotPlan } from "./types";

/**
 * ACE 0.2 — Model Router (pur, testable, isomorphe).
 *
 * ACE ne code JAMAIS « Higgsfield = un modèle ». Le routeur choisit un couple
 * (provider, modèle, mode) à partir d'un CATALOGUE RÉEL découvert au moment du
 * workflow (`hf-api models`, où « listed == usable ») ou d'une config vérifiée.
 *
 * HONNÊTETÉ : ACE ne dispose d'aucune métrique de qualité fiable pour des
 * modèles qu'il n'a pas évalués. Il ne fabrique donc AUCUN classement qualitatif
 * imaginaire : le tri est explicite et vérifiable (correspondance de capacité,
 * puis ordre du catalogue fourni par le provider). Si rien ne correspond, il le
 * dit — il ne choisit pas « au hasard ».
 */

/** Un modèle réellement annoncé par un provider. */
export interface RoutableModel {
  provider: string;
  slug: string;
  /** image | video | audio | 3d_model (tel qu'annoncé par le provider). */
  outputType?: string;
  /** ex. text2image, image2video, text2video (tels qu'annoncés). */
  operationTypes?: string[];
}

/** Mode de génération requis par le besoin. */
export type GenerationMode = "text2image" | "image2video" | "text2video";

export interface ModelRoutingInput {
  intent: AceMediaIntent;
  qualityBar: AceQualityBar;
  /** Ce que ce plan doit produire. */
  outputKind: "image" | "video";
  /** Une image de référence est-elle disponible (verrou d'identité) ? */
  hasReferenceImage: boolean;
  /** La continuité inter-plans est-elle exigée ? */
  continuityRequired: boolean;
  /** Le pipeline doit-il supporter first/last frame ? */
  needsFirstLastFrame?: boolean;
  durationS?: number;
  /** Catalogue RÉEL. Vide ⇒ on ne route pas (on ne devine pas). */
  catalog: readonly RoutableModel[];
}

export type ModelRoutingBlocker =
  /** Aucun catalogue : provider absent/non authentifié, ou découverte échouée. */
  | "CATALOG_UNAVAILABLE"
  /** Catalogue présent mais aucun modèle ne couvre le besoin. */
  | "NO_MATCHING_MODEL";

export interface ModelRoutingDecision {
  provider: string | null;
  model: string | null;
  mode: GenerationMode | null;
  rationale: string;
  /** Autres modèles éligibles, dans l'ordre de préférence. */
  alternatives: string[];
  /** Capacités que le modèle doit couvrir. */
  requiredCapabilities: string[];
  blocker: ModelRoutingBlocker | null;
}

/** Mode requis : dépend de la sortie et de la présence d'une référence. */
export function requiredMode(input: {
  outputKind: "image" | "video";
  hasReferenceImage: boolean;
}): GenerationMode {
  if (input.outputKind === "image") return "text2image";
  // Une vidéo partant d'une image de référence conserve bien mieux l'identité
  // du sujet : c'est le mode privilégié dès qu'une référence existe.
  return input.hasReferenceImage ? "image2video" : "text2video";
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[\s_-]/g, "");
}

/** Le modèle annonce-t-il ce mode ? (comparaison tolérante aux séparateurs) */
function supportsMode(model: RoutableModel, mode: GenerationMode): boolean {
  if (!model.operationTypes || model.operationTypes.length === 0) return false;
  const target = normalize(mode);
  return model.operationTypes.some((op) => normalize(op) === target);
}

/** Le modèle produit-il le bon type de sortie ? */
function matchesOutput(model: RoutableModel, outputKind: "image" | "video"): boolean {
  if (!model.outputType) return false;
  return normalize(model.outputType) === normalize(outputKind);
}

/**
 * Choisit le modèle. Ordre de préférence, entièrement explicable :
 *   1. mode exact annoncé + type de sortie correspondant ;
 *   2. type de sortie correspondant (mode non annoncé par le catalogue) ;
 *   3. rien → blocker honnête.
 * À rang égal, l'ordre du catalogue du provider est conservé (c'est SON
 * classement, pas un score inventé par ACE).
 */
export function routeModel(input: ModelRoutingInput): ModelRoutingDecision {
  const mode = requiredMode(input);
  const requiredCapabilities = [
    input.outputKind === "video" ? "generate-video" : "generate-image",
    `mode:${mode}`,
    ...(input.hasReferenceImage ? ["reference-image"] : []),
    ...(input.needsFirstLastFrame ? ["first-last-frame"] : []),
  ];

  if (input.catalog.length === 0) {
    return {
      provider: null,
      model: null,
      mode: null,
      rationale:
        "Aucun catalogue de modèles disponible (provider absent, non authentifié, " +
        "ou découverte impossible). ACE ne route jamais vers un modèle supposé.",
      alternatives: [],
      requiredCapabilities,
      blocker: "CATALOG_UNAVAILABLE",
    };
  }

  const exact = input.catalog.filter(
    (m) => supportsMode(m, mode) && matchesOutput(m, mode === "text2image" ? "image" : "video"),
  );
  const byOutput = input.catalog.filter(
    (m) => matchesOutput(m, input.outputKind) && !exact.includes(m),
  );

  const ranked = [...exact, ...byOutput];
  if (ranked.length === 0) {
    return {
      provider: null,
      model: null,
      mode,
      rationale:
        `Catalogue disponible (${String(input.catalog.length)} modèle(s)) mais aucun ne couvre ` +
        `le besoin « ${mode} → ${input.outputKind} ». Fournir un asset, changer de stratégie, ` +
        "ou activer un provider couvrant ce mode.",
      alternatives: [],
      requiredCapabilities,
      blocker: "NO_MATCHING_MODEL",
    };
  }

  const chosen = ranked[0] as RoutableModel;
  const viaExact = exact.includes(chosen);
  return {
    provider: chosen.provider,
    model: chosen.slug,
    mode,
    rationale: viaExact
      ? `Modèle « ${chosen.slug} » : annonce explicitement le mode ${mode} et le type de sortie ` +
        `${input.outputKind}. Choisi dans le catalogue réel du provider (aucun classement inventé).`
      : `Modèle « ${chosen.slug} » : produit bien du ${input.outputKind}, mais le catalogue ` +
        `n'annonce pas explicitement le mode ${mode} — à valider avant un lot massif.`,
    alternatives: ranked.slice(1, 4).map((m) => m.slug),
    requiredCapabilities,
    blocker: null,
  };
}

/** Sortie attendue d'un plan, déduite de la stratégie retenue. */
export function outputKindForShot(
  shot: AceShotPlan,
  strategy: string,
): { outputKind: "image" | "video"; continuityRequired: boolean } {
  const videoStrategies = ["video-scroll", "image-sequence", "hybrid"];
  return {
    outputKind: videoStrategies.includes(strategy) ? "video" : "image",
    // Un plan qui déclare un raccord amont ou aval exige la continuité.
    continuityRequired: shot.refIn !== null || shot.refOut !== null,
  };
}

/** Barres de qualité qui exigent une validation humaine du modèle retenu. */
export function routingNeedsHumanValidation(
  qualityBar: AceQualityBar,
  decision: ModelRoutingDecision,
): boolean {
  if (decision.blocker !== null) return false;
  return qualityBar === "photoreal" || qualityBar === "stylized-premium";
}

/** Intentions dont la continuité est structurellement critique. */
export const CONTINUITY_CRITICAL_INTENTS: readonly AceMediaIntent[] = [
  "room-tour",
  "scroll-film",
  "hero-cinematic",
];

import type { AceShotPlan } from "../types";

/**
 * ACE 0.2 — Contrat de PROVIDER média (abstrait, pluggable).
 *
 * Un provider peut GÉNÉRER (images/vidéo IA) et/ou TRAITER (assemblage, frames,
 * optimisation) des médias. L'architecture n'est jamais codée en dur pour un
 * seul outil : chaque provider implémente ce contrat. Un provider non configuré
 * répond honnêtement (`PROVIDER_NOT_CONFIGURED`) — jamais un faux succès.
 */

export type ProviderCapability =
  | "generate-image"
  | "generate-video"
  | "extract-frames"
  | "assemble-video"
  | "optimize"
  | "upscale"
  | "interpolate";

export type ProviderStatus =
  | "READY" // configuré, authentifié, utilisable
  | "PROVIDER_NOT_CONFIGURED" // connu mais aucun mécanisme d'accès configuré
  | "PROVIDER_AUTH_PENDING" // outil présent, authentification manquante
  | "PROVIDER_CONTRACT_UNVERIFIED" // accès possible mais contrat non vérifié
  | "UNAVAILABLE"; // dépendance manquante (ex. ffmpeg ou CLI absent)

export interface ProviderResultOk {
  ok: true;
  /** Chemins/URLs des sorties produites. */
  outputs: string[];
  /** Métadonnées libres (durée, dimensions…). */
  meta?: Record<string, unknown>;
}

export interface ProviderResultErr {
  ok: false;
  code:
    | "PROVIDER_NOT_CONFIGURED"
    | "PROVIDER_AUTH_PENDING"
    | "PROVIDER_CONTRACT_UNVERIFIED"
    | "MEDIA_ASSET_REQUIRED"
    | "UNAVAILABLE"
    | "GENERATION_FAILED";
  message: string;
}

export type ProviderResult = ProviderResultOk | ProviderResultErr;

export interface GenerateRequest {
  shot: AceShotPlan;
  /** Prompt/consigne dérivé du plan (le provider peut l'enrichir). */
  prompt: string;
  /** Image de référence pour verrouiller l'identité du sujet (continuité). */
  referenceImage?: string;
  /** Dossier de sortie. */
  outDir: string;
  /**
   * Slug de modèle résolu par le model router à partir du catalogue RÉEL du
   * provider (`hf-api models`). Jamais un slug inventé.
   */
  model?: string;
  /** Paramètres additionnels conformes au schéma du modèle choisi. */
  params?: Record<string, unknown>;
}

/** Le contrat que tout adapter de provider doit satisfaire. */
export interface MediaProvider {
  readonly name: string;
  readonly capabilities: readonly ProviderCapability[];
  /** Statut réel (configuré ? dépendances présentes ?). */
  status(): ProviderStatus;
  /** Vrai appel de génération — NON simulé. Refuse proprement si non configuré. */
  generate?(req: GenerateRequest): Promise<ProviderResult>;
}

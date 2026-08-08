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
  | "READY" // configuré et utilisable
  | "PROVIDER_NOT_CONFIGURED" // connu mais credentials absents
  | "UNAVAILABLE"; // dépendance manquante (ex. ffmpeg absent)

export interface ProviderResultOk {
  ok: true;
  /** Chemins/URLs des sorties produites. */
  outputs: string[];
  /** Métadonnées libres (durée, dimensions…). */
  meta?: Record<string, unknown>;
}

export interface ProviderResultErr {
  ok: false;
  code: "PROVIDER_NOT_CONFIGURED" | "MEDIA_ASSET_REQUIRED" | "UNAVAILABLE" | "GENERATION_FAILED";
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

import type { AceMediaIntent, AceQualityBar } from "./types";
import type { TechnicalVerdict } from "./qa-verdict";

/**
 * ACE 0.2 — Manifeste de génération (provenance).
 *
 * Chaque média produit laisse une trace vérifiable : par quel provider, quel
 * modèle, quel mode, avec quelles références, à quel coût, en combien de
 * tentatives, et avec quel verdict QA. Cela permet de savoir EXACTEMENT comment
 * un asset a été fabriqué — et de le refaire.
 *
 * SÉCURITÉ : aucun secret n'est stocké. Le prompt est conservé sous forme de
 * hash (et optionnellement en clair si l'utilisateur l'accepte), jamais une
 * clé d'API.
 */

/** Une tentative de génération, réussie ou non. */
export interface AceGenerationAttempt {
  attempt: number;
  /** Code d'échec du provider, ou null si la tentative a produit un fichier. */
  errorCode: string | null;
  message?: string;
  /** Fichiers produits par cette tentative (chemins relatifs au projet). */
  outputs: string[];
  /** Verdict QA technique de cette tentative. */
  technicalVerdict?: TechnicalVerdict;
  /** Raison du rejet, s'il y a eu rejet. */
  rejectedFor?: string[];
}

export interface AceMediaManifestEntry {
  project: string;
  /** Identifiant du sujet (verrou d'identité). */
  subject: string;
  shot: string;
  intent: AceMediaIntent;
  qualityBar: AceQualityBar;
  provider: string | null;
  model: string | null;
  mode: string | null;
  /** Hash stable du prompt (traçabilité sans divulguer le contenu). */
  promptHash: string;
  /** Références visuelles utilisées (chemins/URLs), jamais des secrets. */
  references: string[];
  /** ISO 8601. Renseigné par l'appelant (pas de Date.now() implicite ici). */
  createdAt: string | null;
  /** Coût réellement rapporté par le provider (null si inconnu — jamais inventé). */
  cost: { amount: number; currency: string; source: string } | null;
  attempts: AceGenerationAttempt[];
  /** Fichier retenu, s'il y en a un. */
  output: string | null;
  approved: boolean;
  /** Synthèse QA (technique + revue). */
  qa: {
    technicalVerdict: TechnicalVerdict | null;
    artDirectionVerdict: string | null;
    requiresHumanReview: boolean;
    issues: string[];
  };
}

export interface AceMediaManifest {
  engine: string;
  engineVersion: string;
  project: string;
  generatedAt: string | null;
  entries: AceMediaManifestEntry[];
}

/**
 * Hash stable et court d'un prompt (FNV-1a 32 bits, hex).
 *
 * Volontairement sans dépendance crypto : ce hash sert à la TRAÇABILITÉ
 * (« est-ce le même prompt ? »), pas à la sécurité.
 */
export function promptHash(prompt: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < prompt.length; i += 1) {
    h ^= prompt.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

/** Manifeste vide, prêt à être rempli par l'orchestrateur. */
export function emptyManifest(project: string, engineVersion: string): AceMediaManifest {
  return {
    engine: "Aurexia Cinematic Engine",
    engineVersion,
    project,
    generatedAt: null,
    entries: [],
  };
}

/** Agrégat lisible : combien d'entrées approuvées / rejetées / à revoir. */
export function summarizeManifest(manifest: AceMediaManifest): {
  total: number;
  approved: number;
  rejected: number;
  needsReview: number;
  totalAttempts: number;
} {
  const total = manifest.entries.length;
  const approved = manifest.entries.filter((e) => e.approved).length;
  const needsReview = manifest.entries.filter(
    (e) => !e.approved && e.qa.technicalVerdict === "REVIEW_REQUIRED",
  ).length;
  const rejected = total - approved - needsReview;
  const totalAttempts = manifest.entries.reduce((n, e) => n + e.attempts.length, 0);
  return { total, approved, rejected, needsReview, totalAttempts };
}

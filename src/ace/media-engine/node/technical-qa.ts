import { spawnSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import type { TechnicalVerdict } from "../qa-verdict";

/**
 * ACE 0.2 — QA TECHNIQUE RÉELLE (ffprobe).
 *
 * Module **Node uniquement**. Contrairement au cadre de scoring de `qa.ts` (qui
 * dépend d'une revue humaine), tout ce qui est mesuré ici est **vérifiable
 * automatiquement** : existence, intégrité, dimensions, durée, fps, codec,
 * poids. Un fichier illisible par ffprobe est corrompu — c'est un fait, pas une
 * appréciation.
 *
 * Ce module ne juge PAS la beauté ni le réalisme d'un média (voir
 * `art-direction.ts` + revue humaine / vision).
 */

export interface MediaTechnicalFacts {
  path: string;
  exists: boolean;
  bytes: number;
  /** true si ffprobe a pu décoder l'en-tête (fichier non corrompu). */
  readable: boolean;
  kind: "video" | "image" | "audio" | "unknown";
  width?: number;
  height?: number;
  durationS?: number;
  fps?: number;
  videoCodec?: string;
  audioCodec?: string;
  hasAudio: boolean;
}

export type { TechnicalVerdict } from "../qa-verdict";

export interface TechnicalQaReport {
  facts: MediaTechnicalFacts;
  verdict: TechnicalVerdict;
  /** Problèmes bloquants (⇒ REJECT). */
  failures: string[];
  /** Points à vérifier humainement (⇒ REVIEW_REQUIRED). */
  warnings: string[];
}

/** Contraintes attendues pour un média (issues du plan / du budget). */
export interface TechnicalExpectations {
  minWidth?: number;
  minHeight?: number;
  /** Durée cible en secondes ; tolérance appliquée. */
  expectedDurationS?: number;
  durationToleranceS?: number;
  minFps?: number;
  /** Poids max en Ko (budget performance). */
  maxWeightKb?: number;
  /** L'audio est-il attendu ? (par défaut non — cinéma au scroll muet). */
  expectAudio?: boolean;
}

function ffprobeJson(file: string): unknown | null {
  const res = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_format", "-show_streams", "-of", "json", file],
    { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
  );
  if (res.error || res.status !== 0) return null;
  try {
    return JSON.parse(res.stdout) as unknown;
  } catch {
    return null;
  }
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return typeof v === "object" && v !== null && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function num(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

/** « 30000/1001 » → 29.97 ; « 25/1 » → 25. */
function parseFps(v: unknown): number | undefined {
  if (typeof v !== "string" || !v.includes("/")) return num(v);
  const [a, b] = v.split("/").map(Number);
  if (!a || !b) return undefined;
  return Number((a / b).toFixed(3));
}

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif", ".tiff"]);

/** Mesure les faits techniques d'un média. Aucune interprétation. */
export function probeMedia(file: string): MediaTechnicalFacts {
  const base: MediaTechnicalFacts = {
    path: file,
    exists: existsSync(file),
    bytes: 0,
    readable: false,
    kind: "unknown",
    hasAudio: false,
  };
  if (!base.exists) return base;
  base.bytes = statSync(file).size;
  if (base.bytes === 0) return base;

  const probed = ffprobeJson(file);
  const root = asRecord(probed);
  if (!root) return base;

  const streams = Array.isArray(root["streams"]) ? (root["streams"] as unknown[]) : [];
  const format = asRecord(root["format"]);
  base.readable = streams.length > 0;

  const video = streams.map(asRecord).find((s) => s?.["codec_type"] === "video") ?? null;
  const audio = streams.map(asRecord).find((s) => s?.["codec_type"] === "audio") ?? null;

  if (video) {
    base.width = num(video["width"]);
    base.height = num(video["height"]);
    base.videoCodec = typeof video["codec_name"] === "string" ? video["codec_name"] : undefined;
    const fps = parseFps(video["avg_frame_rate"]) ?? parseFps(video["r_frame_rate"]);
    // Une image fixe est rapportée par ffprobe comme un flux vidéo à 0 fps.
    const ext = path.extname(file).toLowerCase();
    const isImage = IMAGE_EXT.has(ext) || !fps || fps === 0;
    base.kind = isImage ? "image" : "video";
    if (!isImage) base.fps = fps;
  } else if (audio) {
    base.kind = "audio";
  }

  if (audio) {
    base.hasAudio = true;
    base.audioCodec = typeof audio["codec_name"] === "string" ? audio["codec_name"] : undefined;
  }

  const dur = num(format?.["duration"]) ?? num(video?.["duration"]);
  if (dur !== undefined && base.kind === "video") base.durationS = Number(dur.toFixed(3));

  return base;
}

/**
 * Confronte les faits mesurés aux attentes. Verdict :
 *   REJECT           — fait bloquant (absent, vide, corrompu, hors contrainte dure)
 *   REVIEW_REQUIRED  — techniquement lisible mais un point mérite un œil humain
 *   PASS             — conforme aux attentes techniques vérifiables
 *
 * PASS ne signifie pas « beau » ni « vendable » : c'est un feu vert TECHNIQUE.
 */
export function assessTechnical(
  file: string,
  expectations: TechnicalExpectations = {},
): TechnicalQaReport {
  const facts = probeMedia(file);
  const failures: string[] = [];
  const warnings: string[] = [];

  if (!facts.exists) {
    failures.push(`Fichier absent : ${file}`);
    return { facts, verdict: "REJECT", failures, warnings };
  }
  if (facts.bytes === 0) {
    failures.push("Fichier vide (0 octet).");
    return { facts, verdict: "REJECT", failures, warnings };
  }
  if (!facts.readable) {
    failures.push("Média illisible par ffprobe : fichier corrompu ou format non supporté.");
    return { facts, verdict: "REJECT", failures, warnings };
  }

  const { minWidth, minHeight, expectedDurationS, minFps, maxWeightKb, expectAudio } = expectations;
  const tolerance = expectations.durationToleranceS ?? 0.5;

  if (minWidth !== undefined && (facts.width ?? 0) < minWidth) {
    failures.push(
      `Largeur ${String(facts.width ?? 0)} px < minimum requis ${String(minWidth)} px.`,
    );
  }
  if (minHeight !== undefined && (facts.height ?? 0) < minHeight) {
    failures.push(
      `Hauteur ${String(facts.height ?? 0)} px < minimum requis ${String(minHeight)} px.`,
    );
  }
  if (expectedDurationS !== undefined && facts.durationS !== undefined) {
    const delta = Math.abs(facts.durationS - expectedDurationS);
    if (delta > tolerance) {
      warnings.push(
        `Durée ${String(facts.durationS)} s vs ${String(expectedDurationS)} s attendue ` +
          `(écart ${delta.toFixed(2)} s > tolérance ${String(tolerance)} s).`,
      );
    }
  }
  if (minFps !== undefined && facts.kind === "video" && (facts.fps ?? 0) < minFps) {
    failures.push(`Cadence ${String(facts.fps ?? 0)} fps < minimum ${String(minFps)} fps.`);
  }
  if (maxWeightKb !== undefined && facts.bytes / 1024 > maxWeightKb) {
    warnings.push(
      `Poids ${(facts.bytes / 1024).toFixed(0)} Ko > budget ${String(maxWeightKb)} Ko : optimiser avant intégration.`,
    );
  }
  if (expectAudio === false && facts.hasAudio) {
    warnings.push("Piste audio présente alors qu'aucun audio n'est attendu (scroll muet).");
  }
  if (expectAudio === true && !facts.hasAudio) {
    failures.push("Piste audio attendue mais absente.");
  }

  const verdict: TechnicalVerdict =
    failures.length > 0 ? "REJECT" : warnings.length > 0 ? "REVIEW_REQUIRED" : "PASS";
  return { facts, verdict, failures, warnings };
}

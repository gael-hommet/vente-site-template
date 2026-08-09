import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { probeMedia } from "./technical-qa";

/**
 * ACE 0.2 — CONTINUITY ENGINE V2 (sur de VRAIS fichiers).
 *
 * La v1 (`qa.ts`) ne pouvait vérifier que la cohérence STRUCTURELLE déclarée
 * dans le plan (refIn/refOut). La v2 travaille sur les pixels réellement
 * produits :
 *   1. extraction de la frame FINALE du plan N et de la frame INITIALE de N+1 ;
 *   2. comparaison des métadonnées (dimensions, fps) ;
 *   3. mesure SSIM (similarité structurelle) via ffmpeg — un nombre réel,
 *      reproductible, pas une impression.
 *
 * HONNÊTETÉ SUR LA PORTÉE : le SSIM détecte une RUPTURE FRANCHE (coupe, sujet
 * remplacé, cadrage sans rapport). Il ne détecte PAS les dérives fines
 * d'identité (une poignée de porte qui change, un matériau qui glisse) : cela
 * demande une inspection visuelle. Un SSIM élevé n'est donc jamais présenté
 * comme une garantie de continuité — seulement comme l'absence de rupture
 * grossière.
 *
 * Usage clé pour la génération : la frame finale APPROUVÉE du plan N sert de
 * frame de départ / référence forte du plan N+1 (pipelines first/last-frame).
 */

export interface BoundaryFrames {
  /** Frame d'ouverture (t≈0). */
  firstFrame: string;
  /** Frame de clôture (dernière image décodable). */
  lastFrame: string;
}

function run(args: string[]): { ok: boolean; stderr: string } {
  const res = spawnSync("ffmpeg", args, {
    encoding: "utf8",
    stdio: ["ignore", "ignore", "pipe"],
    maxBuffer: 16 * 1024 * 1024,
  });
  return { ok: !res.error && res.status === 0, stderr: res.stderr ?? "" };
}

/**
 * Extrait la première et la dernière frame d'une vidéo (webp, non destructif).
 * La dernière frame est obtenue par recherche proche de la fin plutôt que par
 * `-sseof` seul, plus fiable sur des rushes courts.
 */
export function extractBoundaryFrames(video: string, outDir: string): BoundaryFrames | null {
  if (!existsSync(video)) return null;
  const facts = probeMedia(video);
  if (!facts.readable || facts.kind !== "video") return null;

  mkdirSync(outDir, { recursive: true });
  const base = path.basename(video, path.extname(video));
  const firstFrame = path.join(outDir, `${base}--first.webp`);
  const lastFrame = path.join(outDir, `${base}--last.webp`);

  const first = run([
    "-y",
    "-i",
    video,
    "-frames:v",
    "1",
    "-c:v",
    "libwebp",
    "-quality",
    "92",
    firstFrame,
  ]);
  if (!first.ok) return null;

  // Positionnement juste avant la fin : une durée nulle/inconnue retombe sur
  // `-sseof` (dernier segment) plutôt que d'échouer.
  const duration = facts.durationS ?? 0;
  const seekArgs =
    duration > 0.2 ? ["-ss", String(Math.max(0, duration - 0.08))] : ["-sseof", "-0.1"];
  const last = run([
    "-y",
    ...seekArgs,
    "-i",
    video,
    "-frames:v",
    "1",
    "-c:v",
    "libwebp",
    "-quality",
    "92",
    lastFrame,
  ]);
  if (!last.ok) return null;

  return { firstFrame, lastFrame };
}

/**
 * SSIM entre deux images, via ffmpeg (`-lavfi ssim`).
 * Renvoie une valeur 0..1 (1 = identique) ou null si la mesure est impossible.
 */
export function measureSsim(imageA: string, imageB: string): number | null {
  if (!existsSync(imageA) || !existsSync(imageB)) return null;
  const res = spawnSync(
    "ffmpeg",
    [
      "-i",
      imageA,
      "-i",
      imageB,
      // Les deux images doivent partager la même géométrie pour que SSIM opère.
      "-lavfi",
      "[0:v][1:v]scale2ref=flags=bicubic[a][b];[a][b]ssim",
      "-f",
      "null",
      "-",
    ],
    { encoding: "utf8", stdio: ["ignore", "ignore", "pipe"], maxBuffer: 8 * 1024 * 1024 },
  );
  if (res.error) return null;
  // ffmpeg imprime « ... All:0.987654 (19.1) » sur stderr.
  const m = /All:\s*([0-9]*\.?[0-9]+)/.exec(res.stderr ?? "");
  if (!m?.[1]) return null;
  const v = Number(m[1]);
  return Number.isFinite(v) ? Number(v.toFixed(4)) : null;
}

/**
 * Couleur moyenne d'une image (1 pixel après réduction) — signal complémentaire
 * du SSIM, beaucoup plus interprétable pour « est-ce la même scène ? ».
 */
export function averageColor(image: string): { r: number; g: number; b: number } | null {
  if (!existsSync(image)) return null;
  const res = spawnSync(
    "ffmpeg",
    ["-i", image, "-vf", "scale=1:1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
    { encoding: "buffer", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 1024 },
  );
  const buf = res.stdout;
  if (res.error || !buf || buf.length < 3) return null;
  return { r: buf[0] as number, g: buf[1] as number, b: buf[2] as number };
}

/** Distance euclidienne RGB entre deux couleurs moyennes (0..441). */
export function colorDistance(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
): number {
  const d = Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
  return Number(d.toFixed(2));
}

export type ContinuityVerdict = "CONTINUOUS" | "REVIEW_REQUIRED" | "BROKEN";

export interface RealContinuityReport {
  fromShot: string;
  toShot: string;
  /** Similarité structurelle 0..1 entre fin de N et début de N+1 (null si non mesurable). */
  ssim: number | null;
  /** Écart de couleur moyenne (0..441) — second signal, indépendant du SSIM. */
  colorDistance: number | null;
  verdict: ContinuityVerdict;
  breaks: string[];
  notes: string[];
  frames: { fromLast: string | null; toFirst: string | null };
  /** Toujours vrai : le SSIM ne voit pas les dérives fines d'identité. */
  requiresVisualReview: boolean;
}

/**
 * CALIBRATION MESURÉE (et non supposée) — valeurs relevées sur cet
 * environnement avec ffmpeg 7.1.5 :
 *
 *   images identiques ........................ SSIM 1.000
 *   deux mires complexes différentes (640p) .. SSIM 0.279
 *   mire vs aplat sombre (640p) .............. SSIM 0.155
 *   mire vs aplat sombre (1280p, webp) ....... SSIM 0.657  ← contradiction
 *
 * CONCLUSION HONNÊTE : le SSIM absolu N'EST PAS un discriminateur fiable
 * « même scène / scène différente » — sa valeur dépend fortement du contenu et
 * de la résolution (deux images sans aucun rapport ont scoré 0.155 ici et 0.657
 * là). On ne s'y fie donc JAMAIS seul.
 *
 * ACE croise deux signaux indépendants (SSIM + distance de couleur moyenne) et
 * n'affirme la continuité que s'ils sont TOUS DEUX d'accord. En cas de doute,
 * le verdict est REVIEW_REQUIRED — jamais une approbation par défaut.
 */
export const SSIM_BROKEN_BELOW = 0.85;
export const SSIM_CONTINUOUS_ABOVE = 0.85;
/** Au-delà : scènes visuellement sans rapport (mesuré : ~147 ici, ~11 pour un vrai raccord). */
export const COLOR_DISTANCE_BROKEN_ABOVE = 60;
/** En deçà : même ambiance chromatique (condition nécessaire, pas suffisante). */
export const COLOR_DISTANCE_CONTINUOUS_BELOW = 25;

/**
 * Évalue la continuité RÉELLE entre deux médias produits.
 *
 * `expectHardCut` : certains enchaînements sont des coupes VOLONTAIRES ; dans ce
 * cas un SSIM bas n'est pas un défaut et n'est pas signalé comme rupture.
 */
export function assessRealContinuity(
  fromVideo: string,
  toVideo: string,
  workDir: string,
  opts: { fromShot?: string; toShot?: string; expectHardCut?: boolean } = {},
): RealContinuityReport {
  const fromShot = opts.fromShot ?? path.basename(fromVideo);
  const toShot = opts.toShot ?? path.basename(toVideo);
  const breaks: string[] = [];
  const notes: string[] = [];

  const a = extractBoundaryFrames(fromVideo, workDir);
  const b = extractBoundaryFrames(toVideo, workDir);
  if (!a || !b) {
    return {
      fromShot,
      toShot,
      ssim: null,
      colorDistance: null,
      verdict: "REVIEW_REQUIRED",
      breaks: ["Frames de raccord non extractibles (média illisible ou non vidéo)."],
      notes,
      frames: { fromLast: a?.lastFrame ?? null, toFirst: b?.firstFrame ?? null },
      requiresVisualReview: true,
    };
  }

  // Cohérence de format : une bascule de dimensions/fps casse le raccord.
  const fa = probeMedia(fromVideo);
  const fb = probeMedia(toVideo);
  if (fa.width !== fb.width || fa.height !== fb.height) {
    breaks.push(
      `Dimensions différentes : ${String(fa.width)}×${String(fa.height)} → ${String(fb.width)}×${String(fb.height)}.`,
    );
  }
  if (fa.fps !== undefined && fb.fps !== undefined && Math.abs(fa.fps - fb.fps) > 0.5) {
    notes.push(`Cadences différentes (${String(fa.fps)} → ${String(fb.fps)} fps) : à normaliser.`);
  }

  // Deux signaux INDÉPENDANTS. Aucun n'est fiable seul (voir la calibration).
  const ssim = measureSsim(a.lastFrame, b.firstFrame);
  const colorA = averageColor(a.lastFrame);
  const colorB = averageColor(b.firstFrame);
  const colorDelta = colorA && colorB ? colorDistance(colorA, colorB) : null;

  if (ssim === null) notes.push("SSIM non mesurable : comparaison visuelle manuelle requise.");
  if (colorDelta === null) notes.push("Couleur moyenne non mesurable.");

  if (opts.expectHardCut) {
    notes.push(
      "Coupe volontaire attendue : une faible similarité n'est pas traitée comme un défaut.",
    );
  } else {
    // Rupture affirmée seulement si les DEUX signaux concordent.
    const ssimSaysBroken = ssim !== null && ssim < SSIM_BROKEN_BELOW;
    const colorSaysBroken = colorDelta !== null && colorDelta > COLOR_DISTANCE_BROKEN_ABOVE;
    if (ssimSaysBroken && colorSaysBroken) {
      breaks.push(
        `Rupture franche : SSIM ${String(ssim)} et écart de couleur moyenne ${String(colorDelta)} ` +
          "concordent — la fin du plan précédent et le début du suivant n'ont pas de rapport visuel.",
      );
    } else if (ssimSaysBroken || colorSaysBroken) {
      notes.push(
        `Signaux discordants (SSIM ${String(ssim ?? "—")}, écart couleur ${String(colorDelta ?? "—")}) : ` +
          "raccord incertain, validation visuelle requise.",
      );
    }
  }

  // CONTINUOUS exige l'accord des deux signaux ET l'absence de toute réserve.
  const bothAgreeContinuous =
    ssim !== null &&
    colorDelta !== null &&
    ssim >= SSIM_CONTINUOUS_ABOVE &&
    colorDelta < COLOR_DISTANCE_CONTINUOUS_BELOW;

  let verdict: ContinuityVerdict;
  if (breaks.length > 0) verdict = "BROKEN";
  else if (bothAgreeContinuous && notes.length === 0) verdict = "CONTINUOUS";
  else verdict = "REVIEW_REQUIRED";

  return {
    fromShot,
    toShot,
    ssim,
    colorDistance: colorDelta,
    verdict,
    breaks,
    notes,
    frames: { fromLast: a.lastFrame, toFirst: b.firstFrame },
    // Aucun de ces signaux ne détecte une dérive FINE d'identité : jamais de garantie.
    requiresVisualReview: true,
  };
}

/**
 * Frame de raccord à réinjecter comme référence forte du plan suivant
 * (pipelines first/last-frame). C'est le cœur des room tours continus.
 */
export function continuityReferenceFor(approvedVideo: string, workDir: string): string | null {
  const frames = extractBoundaryFrames(approvedVideo, workDir);
  return frames?.lastFrame ?? null;
}

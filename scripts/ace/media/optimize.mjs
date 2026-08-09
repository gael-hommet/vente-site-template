#!/usr/bin/env node
/**
 * ace:media:optimize — décline un master en variantes web (RÉEL, ffmpeg).
 *
 * Produit une version desktop et une version mobile du même récit. Le mobile
 * est ADAPTÉ (résolution/bitrate), jamais un downgrade honteux : même durée,
 * même montage, même poster.
 *
 * Sorties dans <out> :
 *   desktop.mp4 · desktop.webm · mobile.mp4 · mobile.webm · poster.webp
 *   optimize-report.json (poids, dimensions, gain)
 *
 * Usage :
 *   node scripts/ace/media/optimize.mjs <master.mp4> --out <dir>
 *        [--desktop-width 1920] [--mobile-width 900]
 *        [--desktop-crf 23] [--mobile-crf 28] [--json]
 *
 * Ce script complète (sans le dupliquer) `scripts/assets/video.mjs` du pipeline
 * d'assets : ici on décline un MASTER issu du Creative Media Engine.
 *
 * Sortie : 0 succès · 1 échec · 2 usage.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync, statSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const opt = (f, d = undefined) => {
  const i = args.indexOf(f);
  return i >= 0 ? args[i + 1] : d;
};
const die = (m, code = 2) => {
  console.error(`✗ ${m}`);
  process.exit(code);
};

if (spawnSync("ffmpeg", ["-version"], { stdio: "ignore" }).error) {
  die("ffmpeg absent : optimisation impossible (voir ace:media:capabilities).", 1);
}

const input = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--out");
if (!input) die("usage : optimize.mjs <master.mp4> --out <dir>");
if (!existsSync(input)) die(`master introuvable : ${input}`, 1);

const outDir = opt("--out");
if (!outDir) die("argument requis : --out <dir>");

const desktopWidthWanted = Number(opt("--desktop-width", "1920"));
const mobileWidthWanted = Number(opt("--mobile-width", "900"));
const desktopCrf = Number(opt("--desktop-crf", "23"));
const mobileCrf = Number(opt("--mobile-crf", "28"));

function ffprobe(file) {
  const res = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_format", "-show_streams", "-of", "json", file],
    { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
  );
  if (res.error || res.status !== 0) return null;
  try {
    return JSON.parse(res.stdout);
  } catch {
    return null;
  }
}

const srcProbe = ffprobe(input);
const srcVideo = srcProbe?.streams?.find((s) => s.codec_type === "video");
if (!srcVideo) die(`master illisible ou sans flux vidéo : ${input}`, 1);

// JAMAIS d'upscale : agrandir un master n'ajoute aucune information, alourdit le
// fichier et dégrade le rapport qualité/poids. On plafonne à la largeur source.
const srcWidth = Number(srcVideo.width) || desktopWidthWanted;
const desktopWidth = Math.min(desktopWidthWanted, srcWidth);
const mobileWidth = Math.min(mobileWidthWanted, srcWidth);
const upscaleAvoided = desktopWidthWanted > srcWidth;

mkdirSync(outDir, { recursive: true });

function run(argv, label) {
  const res = spawnSync("ffmpeg", argv, { stdio: ["ignore", "ignore", "pipe"], encoding: "utf8" });
  if (res.status !== 0) {
    console.error(res.stderr?.split("\n").slice(-12).join("\n"));
    die(`${label} a échoué.`, 1);
  }
}

/** Échelle en préservant le ratio, largeur paire imposée (exigence des codecs). */
const scale = (w) => `scale=${w}:-2`;

function encodeVariant(name, width, crf) {
  const mp4 = path.join(outDir, `${name}.mp4`);
  const webm = path.join(outDir, `${name}.webm`);
  // H.264 : compatibilité maximale. faststart = lecture dès le début du buffer
  // (évite d'attendre le moov — essentiel pour le scroll-cinéma).
  run(
    [
      "-y",
      "-i",
      input,
      "-vf",
      scale(width),
      "-c:v",
      "libx264",
      "-preset",
      "slow",
      "-crf",
      String(crf),
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-an",
      mp4,
    ],
    `encodage ${name}.mp4`,
  );
  run(
    [
      "-y",
      "-i",
      input,
      "-vf",
      scale(width),
      "-c:v",
      "libvpx-vp9",
      "-crf",
      String(crf + 8),
      "-b:v",
      "0",
      "-row-mt",
      "1",
      "-an",
      webm,
    ],
    `encodage ${name}.webm`,
  );
  return {
    variant: name,
    width,
    crf,
    mp4: { path: mp4, bytes: statSync(mp4).size },
    webm: { path: webm, bytes: statSync(webm).size },
  };
}

if (!asJson) console.log(`▸ optimisation de ${input}`);
const desktop = encodeVariant("desktop", desktopWidth, desktopCrf);
const mobile = encodeVariant("mobile", mobileWidth, mobileCrf);

// Poster partagé (anti-CLS + affichage instantané avant que la vidéo soit prête).
const poster = path.join(outDir, "poster.webp");
run(
  [
    "-y",
    "-i",
    input,
    "-frames:v",
    "1",
    "-vf",
    scale(desktopWidth),
    "-c:v",
    "libwebp",
    "-quality",
    "86",
    poster,
  ],
  "extraction du poster",
);

const srcBytes = statSync(input).size;
const report = {
  source: {
    path: input,
    bytes: srcBytes,
    width: srcVideo.width,
    height: srcVideo.height,
    durationS: Number(srcProbe?.format?.duration ?? 0),
  },
  variants: [desktop, mobile],
  poster: { path: poster, bytes: statSync(poster).size },
  // Le mobile raconte la MÊME histoire : même durée, même montage.
  narrativePreserved: true,
  /** true si un upscale demandé a été refusé (largeur plafonnée à la source). */
  upscaleAvoided,
};
const reportPath = path.join(outDir, "optimize-report.json");
writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");

if (asJson) {
  console.log(JSON.stringify(report, null, 2));
} else {
  const kb = (n) => `${(n / 1024).toFixed(0)} Ko`;
  // Écart honnête vs source : « −40% » si plus léger, « +12% » si plus lourd.
  const delta = (n) => {
    const p = ((n - srcBytes) / srcBytes) * 100;
    return `${p <= 0 ? "−" : "+"}${Math.abs(p).toFixed(0)}%`;
  };
  console.log(`✓ variantes produites (source ${kb(srcBytes)}, ${String(srcWidth)}px)`);
  if (upscaleAvoided) {
    console.log(
      `  ⚠ upscale refusé : largeur demandée ${String(desktopWidthWanted)}px > source ` +
        `${String(srcWidth)}px — plafonné (agrandir n'ajoute aucune information).`,
    );
  }
  for (const v of [desktop, mobile]) {
    console.log(
      `  ${v.variant.padEnd(8)} ${String(v.width).padStart(4)}px  ` +
        `mp4 ${kb(v.mp4.bytes)} (${delta(v.mp4.bytes)})  webm ${kb(v.webm.bytes)} (${delta(v.webm.bytes)})`,
    );
  }
  console.log(`  poster   ${poster} (${kb(report.poster.bytes)})`);
  console.log(`  rapport  ${reportPath}`);
  console.log("  → même récit sur mobile (durée et montage identiques), résolution adaptée.");
}

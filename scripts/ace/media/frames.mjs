#!/usr/bin/env node
/**
 * ace:media:frames — extrait une SÉQUENCE DE FRAMES d'une vidéo (RÉEL, ffmpeg).
 *
 * Transforme une vidéo continue en frames webp optimisées pour le scrub au
 * scroll (ScrollImageSequence). Opération réelle et non destructive : la source
 * n'est jamais modifiée, les sorties vont dans un dossier dédié.
 *
 * Usage :
 *   node scripts/ace/media/frames.mjs <input.mp4> --out <dir> [--fps 12] [--width 1280]
 *
 * Requiert ffmpeg (voir ace:media:capabilities). Refuse proprement s'il manque.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const opt = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 ? args[i + 1] : d;
};
const die = (m) => {
  console.error(`✗ ${m}`);
  process.exit(1);
};

const input = args[0];
if (!input || input.startsWith("--"))
  die("usage : frames.mjs <input.mp4> --out <dir> [--fps N] [--width N]");
if (!existsSync(input)) die(`vidéo introuvable : ${input}`);

const outDir = opt("--out", null);
if (!outDir) die("argument requis : --out <dir>");
const fps = Number(opt("--fps", "12"));
const width = Number(opt("--width", "1280"));

// ffmpeg requis — refus honnête sinon (jamais de fausse sortie).
const probe = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" });
if (!(probe.status === 0 || probe.status === 1)) {
  die(
    "ffmpeg absent : extraction de frames impossible. Installer ffmpeg (voir ace:media:capabilities).",
  );
}

mkdirSync(outDir, { recursive: true });
const pattern = path.join(outDir, "frame-%04d.webp");

console.log(`▸ extraction : ${input} → ${outDir} (fps=${fps}, width=${width})`);
const res = spawnSync(
  "ffmpeg",
  [
    "-y",
    "-i",
    input,
    "-vf",
    `fps=${fps},scale=${width}:-1`,
    "-c:v",
    "libwebp",
    "-quality",
    "82",
    pattern,
  ],
  { stdio: ["ignore", "ignore", "inherit"] },
);

if (res.status !== 0) die("ffmpeg a échoué (voir la sortie ci-dessus).");

const produced = readdirSync(outDir).filter((f) => f.endsWith(".webp")).length;
console.log(`✓ ${produced} frame(s) webp produites dans ${outDir}`);
console.log(
  "  → utilisables par <ScrollImageSequence frames={[...]} /> (stratégie image-sequence).",
);

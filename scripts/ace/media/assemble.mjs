#!/usr/bin/env node
/**
 * ace:media:assemble — assemble les plans APPROUVÉS en un master (RÉEL, ffmpeg).
 *
 * Concatène des rushes dans l'ordre donné et produit un master web :
 *   master.mp4 (H.264) · master.webm (VP9) · poster.webp · assemble-report.json
 *
 * Stratégie de concaténation :
 *  - si tous les rushes partagent codec + résolution + fps → concat SANS
 *    recompression (`-c copy`, démuxeur concat) : zéro perte, très rapide ;
 *  - sinon → normalisation vers une spec commune puis concat (filtre concat).
 *
 * Audio : ABSENT par défaut (le scroll-cinéma est muet). `--audio` le conserve.
 * Non destructif : les sources ne sont jamais modifiées.
 *
 * Usage :
 *   node scripts/ace/media/assemble.mjs <in1.mp4> <in2.mp4>... --out <dir>
 *        [--manifest <manifest.json>]   # prend les sorties APPROUVÉES
 *        [--width N] [--fps N] [--audio] [--poster-at S] [--json]
 *
 * Sortie : 0 succès · 1 échec · 2 usage.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync, rmSync } from "node:fs";
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
const log = (m) => {
  if (!asJson) console.log(m);
};

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

function parseFps(v) {
  if (typeof v !== "string" || !v.includes("/")) return Number(v) || 0;
  const [a, b] = v.split("/").map(Number);
  return a && b ? Number((a / b).toFixed(3)) : 0;
}

/* ------------------------------- entrées --------------------------------- */
if (spawnSync("ffmpeg", ["-version"], { stdio: "ignore" }).error) {
  die("ffmpeg absent : assemblage impossible (voir ace:media:capabilities).", 1);
}

const outDir = opt("--out");
if (!outDir) die("argument requis : --out <dir>");

let inputs = [];
const manifestPath = opt("--manifest");
if (manifestPath) {
  if (!existsSync(manifestPath)) die(`manifeste introuvable : ${manifestPath}`);
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (e) {
    die(`manifeste illisible : ${e.message}`);
  }
  // SEULES les sorties approuvées sont assemblées : un rejet n'entre jamais
  // dans un master (doctrine premium output gate).
  inputs = (manifest.entries ?? []).filter((e) => e.approved && e.output).map((e) => e.output);
  if (inputs.length === 0) {
    die("aucune sortie APPROUVÉE dans le manifeste : rien à assembler (et rien à maquiller).", 1);
  }
} else {
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a.startsWith("--")) {
      // saute la valeur des options qui en prennent une
      if (!["--audio", "--json"].includes(a)) i += 1;
      continue;
    }
    inputs.push(a);
  }
}

if (inputs.length === 0) die("aucun rush fourni.");
const missing = inputs.filter((f) => !existsSync(f));
if (missing.length > 0) die(`rush(es) introuvable(s) : ${missing.join(", ")}`, 1);

/* --------------------------- analyse des rushes --------------------------- */
const probes = inputs.map((f) => {
  const p = ffprobe(f);
  const v = p?.streams?.find((s) => s.codec_type === "video");
  const a = p?.streams?.find((s) => s.codec_type === "audio");
  if (!v) die(`rush sans flux vidéo lisible (corrompu ?) : ${f}`, 1);
  return {
    file: f,
    width: v.width,
    height: v.height,
    fps: parseFps(v.avg_frame_rate || v.r_frame_rate),
    codec: v.codec_name,
    hasAudio: Boolean(a),
    durationS: Number(p?.format?.duration ?? 0),
  };
});

const keepAudio = args.includes("--audio");
const targetWidth = Number(opt("--width", 0)) || Math.max(...probes.map((p) => p.width));
const targetHeight =
  Math.round(((targetWidth / probes[0].width) * probes[0].height) / 2) * 2 || probes[0].height;
const targetFps = Number(opt("--fps", 0)) || Math.max(...probes.map((p) => p.fps));

const uniform =
  probes.every((p) => p.width === probes[0].width) &&
  probes.every((p) => p.height === probes[0].height) &&
  probes.every((p) => p.codec === probes[0].codec) &&
  probes.every((p) => Math.abs(p.fps - probes[0].fps) < 0.01) &&
  !Number(opt("--width", 0)) &&
  !Number(opt("--fps", 0));

mkdirSync(outDir, { recursive: true });
const masterMp4 = path.join(outDir, "master.mp4");
const masterWebm = path.join(outDir, "master.webm");
const poster = path.join(outDir, "poster.webp");

log(`▸ ${inputs.length} rush(es) · cible ${targetWidth}×${targetHeight} @ ${targetFps}fps`);
log(`  mode : ${uniform ? "concat SANS recompression (-c copy)" : "normalisation puis concat"}`);

function run(bin, argv, label) {
  const res = spawnSync(bin, argv, { stdio: ["ignore", "ignore", "pipe"], encoding: "utf8" });
  if (res.status !== 0) {
    console.error(res.stderr?.split("\n").slice(-12).join("\n"));
    die(`${label} a échoué.`, 1);
  }
}

/* ------------------------------ assemblage -------------------------------- */
const listFile = path.join(outDir, ".concat-list.txt");
if (uniform) {
  writeFileSync(listFile, inputs.map((f) => `file '${path.resolve(f)}'`).join("\n") + "\n");
  const copyArgs = ["-y", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy"];
  if (!keepAudio) copyArgs.push("-an");
  run("ffmpeg", [...copyArgs, masterMp4], "concat sans recompression");
} else {
  // Filtre concat : chaque entrée normalisée (échelle + fps + SAR) puis concaténée.
  const inArgs = inputs.flatMap((f) => ["-i", f]);
  const parts = inputs
    .map(
      (_, i) =>
        `[${i}:v]scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease,` +
        `pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${targetFps}[v${i}]`,
    )
    .join(";");
  const chain = inputs.map((_, i) => `[v${i}]`).join("");
  const filter = `${parts};${chain}concat=n=${inputs.length}:v=1:a=0[outv]`;
  run(
    "ffmpeg",
    [
      ...["-y", ...inArgs, "-filter_complex", filter, "-map", "[outv]"],
      ...["-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-an"],
      masterMp4,
    ],
    "normalisation + concat",
  );
}
rmSync(listFile, { force: true });

// Master WebM (VP9) — meilleure compression pour le web.
run(
  "ffmpeg",
  [
    "-y",
    "-i",
    masterMp4,
    "-c:v",
    "libvpx-vp9",
    "-crf",
    "34",
    "-b:v",
    "0",
    "-row-mt",
    "1",
    "-an",
    masterWebm,
  ],
  "encodage WebM",
);

// Poster : image d'ouverture (anti-CLS, anti-flash noir côté runtime).
const posterAt = opt("--poster-at", "0");
run(
  "ffmpeg",
  [
    "-y",
    "-ss",
    String(posterAt),
    "-i",
    masterMp4,
    "-frames:v",
    "1",
    "-c:v",
    "libwebp",
    "-quality",
    "88",
    poster,
  ],
  "extraction du poster",
);

/* -------------------------------- rapport --------------------------------- */
const finalProbe = ffprobe(masterMp4);
const fv = finalProbe?.streams?.find((s) => s.codec_type === "video");
const report = {
  inputs: probes,
  mode: uniform ? "concat-copy" : "normalize-concat",
  target: { width: targetWidth, height: targetHeight, fps: targetFps, audio: keepAudio },
  outputs: {
    mp4: { path: masterMp4, bytes: statSync(masterMp4).size },
    webm: { path: masterWebm, bytes: statSync(masterWebm).size },
    poster: { path: poster, bytes: statSync(poster).size },
  },
  master: {
    width: fv?.width,
    height: fv?.height,
    fps: parseFps(fv?.avg_frame_rate || fv?.r_frame_rate),
    codec: fv?.codec_name,
    durationS: Number(finalProbe?.format?.duration ?? 0),
    hasAudio: Boolean(finalProbe?.streams?.some((s) => s.codec_type === "audio")),
  },
};
const reportPath = path.join(outDir, "assemble-report.json");
writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");

if (asJson) {
  console.log(JSON.stringify(report, null, 2));
} else {
  const kb = (n) => `${(n / 1024).toFixed(0)} Ko`;
  console.log(`\n✓ master assemblé (${report.master.durationS.toFixed(2)}s)`);
  console.log(`  mp4    : ${masterMp4} (${kb(report.outputs.mp4.bytes)})`);
  console.log(`  webm   : ${masterWebm} (${kb(report.outputs.webm.bytes)})`);
  console.log(`  poster : ${poster} (${kb(report.outputs.poster.bytes)})`);
  console.log(`  rapport ffprobe : ${reportPath}`);
  console.log("  → contrôler avec : pnpm ace:media:qa " + masterMp4);
}

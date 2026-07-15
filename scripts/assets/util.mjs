// Shared helpers for the asset pipeline scripts. Pure Node, no build step.
import { readdir, stat, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

export const ROOT = process.cwd();
export const INPUT_DIR = path.join(ROOT, "input", "assets");
export const PUBLIC_DIR = path.join(ROOT, "public");
export const OUT_IMAGES = path.join(PUBLIC_DIR, "assets");
export const OUT_VIDEO = path.join(PUBLIC_DIR, "assets", "video");
export const OUT_SEQUENCES = path.join(PUBLIC_DIR, "sequences");
export const OUT_MODELS = path.join(PUBLIC_DIR, "models");
export const OUT_POSTERS = path.join(PUBLIC_DIR, "posters");

export const IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".tiff"];
export const VIDEO_EXT = [".mp4", ".mov", ".webm", ".m4v", ".avi"];
export const MODEL_EXT = [".glb", ".gltf"];

/** Size (bytes) above which the auditor warns, per asset kind. */
export const BUDGET = {
  image: 500 * 1024, // 500 KB
  video: 8 * 1024 * 1024, // 8 MB
  model: 4 * 1024 * 1024, // 4 MB
};

export function human(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let v = bytes / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(1)} ${units[i]}`;
}

export const color = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
};

/** Recursively walk a directory, returning absolute file paths. */
export async function walk(dir) {
  if (!existsSync(dir)) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files;
}

export async function fileSize(p) {
  try {
    return (await stat(p)).size;
  } catch {
    return 0;
  }
}

export async function ensureDir(dir) {
  await mkdir(dir, { recursive: true });
}

export function ext(p) {
  return path.extname(p).toLowerCase();
}

/** Detect whether an external binary is available on PATH. */
export function hasBinary(bin) {
  const res = spawnSync(bin, ["-version"], { stdio: "ignore" });
  return res.status === 0 || res.status === 1; // some tools exit 1 on -version
}

export function run(bin, args, opts = {}) {
  return spawnSync(bin, args, { stdio: "inherit", ...opts });
}

export function header(title) {
  console.log("\n" + color.bold(color.cyan(`▎ ${title}`)));
}

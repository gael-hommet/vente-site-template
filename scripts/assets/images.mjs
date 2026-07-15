#!/usr/bin/env node
// pnpm assets:images — optimize source images from input/assets → public/assets.
// Uses sharp. Never overwrites originals. Emits AVIF + WebP + a sized fallback.
import path from "node:path";
import { existsSync } from "node:fs";
import {
  INPUT_DIR,
  OUT_IMAGES,
  IMAGE_EXT,
  walk,
  ensureDir,
  ext,
  human,
  fileSize,
  color,
  header,
} from "./util.mjs";

const WIDTHS = [640, 1080, 1920]; // responsive breakpoints
const QUALITY = { avif: 55, webp: 72, jpeg: 78 };

async function loadSharp() {
  try {
    const mod = await import("sharp");
    return mod.default;
  } catch {
    console.error(color.red("sharp introuvable. Lancez `pnpm install`."));
    process.exit(1);
  }
}

async function main() {
  const sharp = await loadSharp();
  const files = (await walk(INPUT_DIR)).filter((f) => IMAGE_EXT.includes(ext(f)));
  if (files.length === 0) {
    console.log(color.dim("Aucune image source dans input/assets/. Rien à faire."));
    return;
  }
  await ensureDir(OUT_IMAGES);
  header(`Optimisation de ${files.length} image(s)`);

  let savedBytes = 0;
  for (const src of files) {
    const base = path.basename(src, ext(src)).replace(/\s+/g, "-").toLowerCase();
    const srcSize = await fileSize(src);
    const meta = await sharp(src).metadata();
    const maxW = meta.width ?? Math.max(...WIDTHS);

    for (const w of WIDTHS) {
      if (w > maxW * 1.05) continue; // don't upscale
      for (const fmt of ["avif", "webp"]) {
        const out = path.join(OUT_IMAGES, `${base}-${w}.${fmt}`);
        if (existsSync(out)) continue;
        const pipe = sharp(src).resize({ width: w, withoutEnlargement: true });
        if (fmt === "avif") await pipe.avif({ quality: QUALITY.avif }).toFile(out);
        else await pipe.webp({ quality: QUALITY.webp }).toFile(out);
        savedBytes += Math.max(0, srcSize - (await fileSize(out)));
        console.log(`  ${color.green("→")} ${path.relative(process.cwd(), out)} (${human(await fileSize(out))})`);
      }
    }
    // A universal poster JPEG for <video>/OG fallback.
    const poster = path.join(OUT_IMAGES, `${base}-poster.jpg`);
    if (!existsSync(poster)) {
      await sharp(src).resize({ width: 1200, withoutEnlargement: true }).jpeg({ quality: QUALITY.jpeg }).toFile(poster);
    }
  }
  header("Terminé");
  console.log(color.green(`  Économie estimée: ${human(savedBytes)}. Originaux conservés dans input/assets/.`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

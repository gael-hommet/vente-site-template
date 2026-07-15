#!/usr/bin/env node
// pnpm assets:video — transcode source videos → web MP4 + WebM + poster, and
// (optionally) a WebP image sequence for scroll-scrubbing. Requires ffmpeg.
import path from "node:path";
import { existsSync } from "node:fs";
import {
  INPUT_DIR,
  OUT_VIDEO,
  OUT_SEQUENCES,
  OUT_POSTERS,
  VIDEO_EXT,
  walk,
  ensureDir,
  ext,
  hasBinary,
  run,
  color,
  header,
} from "./util.mjs";

const SEQUENCE_FPS = 12; // frames/sec extracted for image sequences
const MAX_WIDTH = 1920;

async function main() {
  if (!hasBinary("ffmpeg")) {
    console.log(
      color.yellow(
        "ffmpeg introuvable. Il est fourni par le devcontainer (voir .devcontainer/devcontainer.json).\n" +
          "Installation manuelle: `sudo apt-get update && sudo apt-get install -y ffmpeg`.",
      ),
    );
    process.exit(0); // graceful, non-fatal
  }

  const makeSequence = process.argv.includes("--sequence");
  const files = (await walk(INPUT_DIR)).filter((f) => VIDEO_EXT.includes(ext(f)));
  if (files.length === 0) {
    console.log(color.dim("Aucune vidéo source dans input/assets/. Rien à faire."));
    return;
  }
  await ensureDir(OUT_VIDEO);
  await ensureDir(OUT_POSTERS);
  header(`Transcodage de ${files.length} vidéo(s)`);

  for (const src of files) {
    const base = path.basename(src, ext(src)).replace(/\s+/g, "-").toLowerCase();
    const scale = `scale='min(${MAX_WIDTH},iw)':-2`;

    const mp4 = path.join(OUT_VIDEO, `${base}.mp4`);
    if (!existsSync(mp4)) {
      run("ffmpeg", ["-y", "-i", src, "-vf", scale, "-c:v", "libx264", "-crf", "23", "-preset", "slow", "-movflags", "+faststart", "-an", mp4]);
    }

    const webm = path.join(OUT_VIDEO, `${base}.webm`);
    if (!existsSync(webm)) {
      run("ffmpeg", ["-y", "-i", src, "-vf", scale, "-c:v", "libvpx-vp9", "-crf", "34", "-b:v", "0", "-an", webm]);
    }

    const poster = path.join(OUT_POSTERS, `${base}.jpg`);
    if (!existsSync(poster)) {
      run("ffmpeg", ["-y", "-i", src, "-vf", `${scale},thumbnail`, "-frames:v", "1", poster]);
    }

    if (makeSequence) {
      const seqDir = path.join(OUT_SEQUENCES, base);
      await ensureDir(seqDir);
      run("ffmpeg", ["-y", "-i", src, "-vf", `fps=${SEQUENCE_FPS},${scale}`, "-c:v", "libwebp", "-quality", "70", path.join(seqDir, "frame-%04d.webp")]);
      console.log(color.green(`  → séquence WebP: ${path.relative(process.cwd(), seqDir)}`));
    }
    console.log(color.green(`  → ${base}: mp4 + webm + poster`));
  }
  header("Terminé");
  console.log(color.dim("  Originaux conservés. Aucune piste audio n'est encodée (pas de lecture sonore auto)."));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

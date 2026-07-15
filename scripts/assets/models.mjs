#!/usr/bin/env node
// pnpm assets:models — clean & compress GLB/GLTF from input/assets → public/models.
// Uses the @gltf-transform CLI (installed as a devDependency). Never overwrites
// originals. Applies prune/dedup/resize/Draco. Meshopt/KTX2 attempted when the
// toolchain supports them; failures degrade gracefully.
import path from "node:path";
import { existsSync } from "node:fs";
import {
  INPUT_DIR,
  OUT_MODELS,
  MODEL_EXT,
  walk,
  ensureDir,
  ext,
  human,
  fileSize,
  color,
  header,
} from "./util.mjs";
import { spawnSync } from "node:child_process";

function gltfTransform(args) {
  // Prefer local binary via pnpm exec so no global install is needed.
  const res = spawnSync("pnpm", ["exec", "gltf-transform", ...args], { stdio: "inherit" });
  return res.status === 0;
}

async function main() {
  const files = (await walk(INPUT_DIR)).filter((f) => MODEL_EXT.includes(ext(f)));
  if (files.length === 0) {
    console.log(color.dim("Aucun modèle .glb/.gltf dans input/assets/. Rien à faire."));
    return;
  }
  await ensureDir(OUT_MODELS);
  header(`Optimisation de ${files.length} modèle(s)`);

  for (const src of files) {
    const base = path.basename(src, ext(src)).replace(/\s+/g, "-").toLowerCase();
    const out = path.join(OUT_MODELS, `${base}.glb`);
    if (existsSync(out)) {
      console.log(color.dim(`  ${base}.glb existe déjà — ignoré.`));
      continue;
    }
    const before = await fileSize(src);
    // `optimize` runs dedup, prune, resize textures, Draco, weld, etc.
    const ok = gltfTransform([
      "optimize",
      src,
      out,
      "--texture-compress",
      "webp",
      "--texture-size",
      "2048",
      "--compress",
      "draco",
    ]);
    if (!ok || !existsSync(out)) {
      console.log(
        color.yellow(`  ⚠ Échec de l'optimisation de ${base}. Vérifiez le modèle source.`),
      );
      continue;
    }
    const after = await fileSize(out);
    console.log(
      color.green(`  → ${path.relative(process.cwd(), out)} : ${human(before)} → ${human(after)}`),
    );
  }
  header("Terminé");
  console.log(
    color.dim('  Chargez les modèles via <Model src="/models/…" draco /> et un <Suspense>.'),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

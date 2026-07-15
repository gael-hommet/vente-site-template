#!/usr/bin/env node
// pnpm assets:all — run the full pipeline: audit → images → video → models.
import { spawnSync } from "node:child_process";
import { color, header } from "./util.mjs";

const steps = [
  ["Images", "scripts/assets/images.mjs", []],
  ["Vidéos", "scripts/assets/video.mjs", []],
  ["Modèles 3D", "scripts/assets/models.mjs", []],
  ["Audit final", "scripts/assets/audit.mjs", []],
];

for (const [label, script, args] of steps) {
  header(label);
  const res = spawnSync("node", [script, ...args], { stdio: "inherit" });
  if (res.status !== 0) {
    console.error(color.red(`Étape "${label}" a échoué (code ${res.status}).`));
    process.exit(res.status ?? 1);
  }
}
console.log(color.green("\n✔ Pipeline d'assets terminé.\n"));

#!/usr/bin/env node
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";

/**
 * ACE SPATIAL — doctor.
 *
 * Répond à une seule question : « cette machine peut-elle produire une
 * expérience spatiale HONNÊTE, sans rien payer ni rien inventer ? »
 *
 * Aucun téléchargement de modèle, aucun service distant, aucun compte.
 */

const checks = [];
const add = (name, ok, detail, blocking = false) => checks.push({ name, ok, detail, blocking });

// 1. Le moteur de rendu est-il là ?
for (const pkg of ["three", "@react-three/fiber", "@react-three/drei", "gsap"]) {
  add(
    pkg,
    existsSync(`node_modules/${pkg}`),
    existsSync(`node_modules/${pkg}`) ? "présent" : "absent",
    true,
  );
}

// 2. Fabrication locale d'images/cartes de profondeur de test (coût 0 €).
let ffmpeg = false;
try {
  execSync("ffmpeg -version", { stdio: "ignore" });
  ffmpeg = true;
} catch {
  ffmpeg = false;
}
add(
  "ffmpeg",
  ffmpeg,
  ffmpeg
    ? "présent — fabrication locale de fixtures possible"
    : "absent — les fixtures de test ne peuvent pas être régénérées (sans effet sur un vrai site)",
);

// 3. Estimation automatique de profondeur : ACE 0.3 n'en embarque AUCUNE.
add(
  "estimation de profondeur locale",
  false,
  "non fournie : ACE ne prétend pas générer une depth map. " +
    "Fournissez-la avec l'image, sinon la scène est refusée (DEPTH_MAP_REQUIRED).",
);

// 4. Aucun provider distant, aucune clé.
add("coût média externe", true, "0 € — aucun provider, aucune clé, aucun crédit");

const blocking = checks.filter((c) => c.blocking && !c.ok);

console.log("\nACE SPATIAL CINEMA — état de l'environnement\n");
for (const c of checks) {
  const mark = c.ok ? "✔" : c.blocking ? "✘" : "•";
  console.log(`  ${mark} ${c.name.padEnd(34)} ${c.detail}`);
}

if (blocking.length > 0) {
  console.log(
    `\n${String(blocking.length)} élément(s) indispensable(s) manquant(s). Lancez « pnpm install ».\n`,
  );
  process.exit(1);
}
console.log("\nPrêt : le moteur spatial peut tourner (rendu réel, coût externe nul).\n");

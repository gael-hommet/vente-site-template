#!/usr/bin/env node
/**
 * ace:compare-fingerprints — détecteur de PROXIMITÉ STRUCTURELLE entre sites.
 *
 * Compare des « empreintes créatives » (docs/anti-template/*-fingerprint.json)
 * deux à deux et calcule un score de proximité sur des dimensions pondérées.
 * Le score ne prétend PAS mesurer la créativité : il détecte une ressemblance
 * structurelle EXCESSIVE (deux sites qui seraient « le même template »).
 *
 * Modèle :
 * - chaque dimension a un poids ; certaines sont CATÉGORIELLES (égal/différent),
 *   d'autres TEXTUELLES (similarité de Jaccard sur les mots-clés) ;
 * - proximité = somme(poids_i × similarité_i) / somme(poids_i), dans [0,1] ;
 * - seuil MAX_PROXIMITY = 0.5 : au-delà, deux sites sont jugés trop proches ;
 * - verdict par paire + verdict global (toutes les paires doivent passer).
 *
 * Limites documentées :
 * - deux ids de recipes différents comptent comme « différents » même s'ils
 *   pourraient rendre un DOM proche → la comparaison est complétée par des
 *   dimensions structurelles observées (DOM, densité, média, mobile) ;
 * - le score est un GARDE-FOU, pas un juge esthétique.
 *
 * Usage : node scripts/ace/compare-creative-fingerprints.mjs [--dir docs/anti-template] [--out …/comparison.json]
 * Script INTERNE au moteur (élagué des sites générés).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const args = process.argv.slice(2);
const opt = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 ? args[i + 1] : d;
};
const dir = path.resolve(opt("--dir", path.join(ROOT, "docs/anti-template")));
const outPath = path.resolve(opt("--out", path.join(dir, "comparison.json")));

/** Seuil de proximité au-delà duquel deux sites sont jugés trop proches. */
export const MAX_PROXIMITY = 0.5;

/**
 * Dimensions comparées. `kind`:
 * - "cat"  : catégorielle (1 si égal, 0 sinon) ;
 * - "text" : Jaccard sur les mots normalisés.
 * `path` : accès dans le fingerprint (points pour l'imbrication).
 */
export const DIMENSIONS = [
  { key: "designLanguage", path: "designLanguage", weight: 3, kind: "cat" },
  { key: "hero", path: "recipes.hero", weight: 3, kind: "cat" },
  { key: "navigation", path: "recipes.navigation", weight: 3, kind: "cat" },
  { key: "projects", path: "recipes.projects", weight: 2, kind: "cat" },
  { key: "storytelling", path: "recipes.storytelling", weight: 2, kind: "cat" },
  { key: "conversion", path: "recipes.conversion", weight: 2, kind: "cat" },
  { key: "layout", path: "recipes.layout", weight: 2, kind: "cat" },
  { key: "motionProfile", path: "motionProfile", weight: 2, kind: "cat" },
  { key: "sceneProfile", path: "sceneProfile", weight: 2, kind: "cat" },
  { key: "webgl", path: "webgl", weight: 3, kind: "cat" },
  { key: "density", path: "density", weight: 2, kind: "cat" },
  { key: "dominantSurface", path: "dominantSurface", weight: 2, kind: "text" },
  { key: "sectionOrder", path: "sectionOrder", weight: 3, kind: "text" },
  { key: "heroDom", path: "heroDom", weight: 3, kind: "text" },
  { key: "navigationDom", path: "navigationDom", weight: 3, kind: "text" },
  { key: "collectionDom", path: "collectionDom", weight: 2, kind: "text" },
  { key: "conversionDom", path: "conversionDom", weight: 2, kind: "text" },
  { key: "mobileBehavior", path: "mobileBehavior", weight: 2, kind: "text" },
  { key: "mediaTreatment", path: "mediaTreatment", weight: 2, kind: "text" },
];

const STOP = new Set([
  "le",
  "la",
  "les",
  "un",
  "une",
  "de",
  "du",
  "des",
  "et",
  "à",
  "en",
  "sur",
  "pas",
  "plus",
  "par",
  "au",
  "aux",
  "ou",
  "the",
  "a",
  "of",
  "and",
]);

function get(obj, dottedPath) {
  return dottedPath.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function words(value) {
  const text = Array.isArray(value) ? value.join(" ") : String(value ?? "");
  return new Set(
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .split(" ")
      .filter((w) => w.length > 2 && !STOP.has(w)),
  );
}

function jaccard(a, b) {
  const A = words(a);
  const B = words(b);
  if (A.size === 0 && B.size === 0) return 1;
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

/** Similarité d'une dimension entre deux fingerprints, dans [0,1]. */
export function dimensionSimilarity(dim, fpA, fpB) {
  const a = get(fpA, dim.path);
  const b = get(fpB, dim.path);
  if (dim.kind === "cat") return a === b ? 1 : 0;
  return jaccard(a, b);
}

/** Proximité globale (moyenne pondérée) entre deux fingerprints. */
export function proximity(fpA, fpB, dims = DIMENSIONS) {
  let num = 0;
  let den = 0;
  const perDimension = {};
  for (const dim of dims) {
    const sim = dimensionSimilarity(dim, fpA, fpB);
    perDimension[dim.key] = Number(sim.toFixed(3));
    num += dim.weight * sim;
    den += dim.weight;
  }
  const score = den === 0 ? 0 : num / den;
  return { score: Number(score.toFixed(3)), perDimension };
}

/** Compare une paire et rend un verdict. */
export function comparePair(nameA, fpA, nameB, fpB) {
  const { score, perDimension } = proximity(fpA, fpB);
  const identicalDims = Object.entries(perDimension)
    .filter(([, s]) => s === 1)
    .map(([k]) => k);
  const differentDims = Object.entries(perDimension)
    .filter(([, s]) => s === 0)
    .map(([k]) => k);
  const tooClose = score > MAX_PROXIMITY;
  return {
    pair: `${nameA} ↔ ${nameB}`,
    proximity: score,
    threshold: MAX_PROXIMITY,
    tooClose,
    verdict: tooClose ? "PROXIMITÉ EXCESSIVE" : "distinct",
    identicalDimensions: identicalDims,
    differentDimensions: differentDims,
  };
}

/* --------------------------------- main ---------------------------------- */
function main() {
  const files = {
    inquarto: path.join(dir, "inquarto-fingerprint.json"),
    editorial: path.join(dir, "editorial-fingerprint.json"),
    immersive: path.join(dir, "immersive-fingerprint.json"),
  };
  for (const [k, f] of Object.entries(files)) {
    if (!existsSync(f)) {
      console.error(`✗ fingerprint manquant : ${k} (${f})`);
      process.exit(2);
    }
  }
  const fp = Object.fromEntries(
    Object.entries(files).map(([k, f]) => [k, JSON.parse(readFileSync(f, "utf8"))]),
  );

  const pairs = [
    comparePair("inquarto", fp.inquarto, "editorial", fp.editorial),
    comparePair("inquarto", fp.inquarto, "immersive", fp.immersive),
    comparePair("editorial", fp.editorial, "immersive", fp.immersive),
  ];
  const allDistinct = pairs.every((p) => !p.tooClose);

  const report = {
    generatedFrom: path.relative(ROOT, dir),
    threshold: MAX_PROXIMITY,
    method:
      "moyenne pondérée de similarités par dimension (catégorielles : égal/différent ; textuelles : Jaccard). Score ∈ [0,1]. > seuil = trop proche.",
    weights: Object.fromEntries(DIMENSIONS.map((d) => [d.key, d.weight])),
    limits:
      "Garde-fou structurel, pas un juge esthétique. Deux recipes différentes comptent comme différentes même si un rendu pouvait converger — complété par les dimensions DOM/mobile/média observées.",
    pairs,
    verdict: allDistinct
      ? "ANTI-TEMPLATE CONCLUANT : les trois expériences sont structurellement distinctes."
      : "ÉCHEC : au moins une paire dépasse le seuil de proximité.",
  };

  writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
  process.exit(allDistinct ? 0 : 1);
}

// Exécuté directement (pas importé par les tests).
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}

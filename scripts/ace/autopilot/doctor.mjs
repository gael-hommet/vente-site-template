#!/usr/bin/env node
/**
 * ace:doctor — « ACE est-il prêt ? », en une seule commande.
 *
 * Destiné À TOUT LE MONDE, y compris non technique. Une seule question compte :
 * puis-je demander un site maintenant ? La réponse tient en une ligne :
 *
 *   ACE READY
 *   ACE NOT READY
 *
 * ACE n'a besoin d'AUCUN service payant ni d'aucune clé d'API : il travaille à
 * partir des médias réels (fournis, officiels, ou apportés par l'utilisateur).
 * Le coût média d'un site ACE est de 0 €.
 *
 * Deux catégories, jamais mélangées :
 *  - ESSENTIEL : sans ça, ACE ne peut pas produire de site ;
 *  - CONFORT  : sans ça, ACE produit quand même le site (qualité de la relecture
 *    visuelle ou du traitement 3D en retrait).
 *
 * Sortie : 0 = ACE READY · 1 = un essentiel manque.
 */
import { spawnSync } from "node:child_process";
import { accessSync, constants, existsSync, statfsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:net";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const asJson = process.argv.includes("--json");

/* -------------------------------------------------------------------------- */
/* Sondes                                                                     */
/* -------------------------------------------------------------------------- */

function runVersion(bin, args = ["--version"]) {
  const res = spawnSync(bin, args, { encoding: "utf8" });
  if (res.error) return null;
  const out = `${res.stdout ?? ""}${res.stderr ?? ""}`.trim();
  return out.split("\n")[0] ?? "";
}

function hasPackage(name) {
  return existsSync(path.join(ROOT, "node_modules", name));
}

function canWrite(dir) {
  try {
    accessSync(dir, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

function freeDiskGb() {
  try {
    const s = statfsSync(ROOT);
    return Math.round((s.bavail * s.bsize) / 1024 ** 3);
  } catch {
    return null;
  }
}

async function portFree(port) {
  return new Promise((resolve) => {
    const srv = createServer();
    srv.once("error", () => resolve(false));
    srv.once("listening", () => srv.close(() => resolve(true)));
    srv.listen(port, "0.0.0.0");
  });
}

/** Le navigateur Playwright est-il réellement installé (et pas juste le paquet) ? */
function browserInstalled() {
  if (!hasPackage("@playwright/test")) return false;
  const res = spawnSync("pnpm", ["exec", "playwright", "--version"], { encoding: "utf8" });
  if (res.error || res.status !== 0) return false;
  // `playwright install` dépose les navigateurs dans un cache utilisateur.
  const cacheDirs = [
    process.env.PLAYWRIGHT_BROWSERS_PATH,
    path.join(process.env.HOME ?? "", ".cache/ms-playwright"),
  ].filter(Boolean);
  return cacheDirs.some((d) => existsSync(d));
}

/* -------------------------------------------------------------------------- */
/* Collecte                                                                   */
/* -------------------------------------------------------------------------- */

const nodeMajor = Number(process.versions.node.split(".")[0]);
const disk = freeDiskGb();
const previewPortFree = await portFree(3000);

/** tier: "essential" bloque tout ; "optional" = confort, jamais bloquant. */
const checks = [
  {
    id: "node",
    tier: "essential",
    label: "Node.js ≥ 20",
    ok: nodeMajor >= 20,
    detail: `v${process.versions.node}`,
    fix: "Installer Node 20+ (le Codespace ACE le fournit).",
  },
  {
    id: "pnpm",
    tier: "essential",
    label: "pnpm",
    ok: runVersion("pnpm") !== null,
    detail: runVersion("pnpm") ?? "absent",
    fix: "corepack enable && corepack prepare pnpm@latest --activate",
  },
  {
    id: "deps",
    tier: "essential",
    label: "Dépendances installées",
    ok: existsSync(path.join(ROOT, "node_modules", "next")),
    detail: existsSync(path.join(ROOT, "node_modules", "next"))
      ? "node_modules présent"
      : "absentes",
    fix: "pnpm install",
  },
  {
    id: "git",
    tier: "essential",
    label: "git",
    ok: runVersion("git") !== null,
    detail: runVersion("git") ?? "absent",
    fix: "Installer git.",
  },
  {
    id: "write",
    tier: "essential",
    label: "Écriture dans le projet",
    ok: canWrite(ROOT),
    detail: canWrite(ROOT) ? "autorisée" : "refusée",
    fix: "Vérifier les permissions du dossier.",
  },
  {
    id: "ffmpeg",
    tier: "essential",
    label: "ffmpeg (assemblage vidéo)",
    ok: runVersion("ffmpeg", ["-version"]) !== null,
    detail: (runVersion("ffmpeg", ["-version"]) ?? "absent").slice(0, 40),
    fix: "sudo apt-get install -y ffmpeg",
  },
  {
    id: "ffprobe",
    tier: "essential",
    label: "ffprobe (contrôle qualité média)",
    ok: runVersion("ffprobe", ["-version"]) !== null,
    detail: (runVersion("ffprobe", ["-version"]) ?? "absent").slice(0, 40),
    fix: "sudo apt-get install -y ffmpeg",
  },
  {
    id: "sharp",
    tier: "essential",
    label: "sharp (images)",
    ok: hasPackage("sharp"),
    detail: hasPackage("sharp") ? "installé" : "absent",
    fix: "pnpm install",
  },
  {
    id: "gltf",
    tier: "optional",
    label: "@gltf-transform (modèles 3D)",
    ok: hasPackage("@gltf-transform/cli") || hasPackage("@gltf-transform/functions"),
    detail: hasPackage("@gltf-transform/cli")
      ? "installé (cli)"
      : hasPackage("@gltf-transform/functions")
        ? "installé (functions)"
        : "absent",
    fix: "pnpm install",
  },
  {
    id: "browser",
    tier: "optional",
    label: "Navigateur (captures & QA visuelle)",
    ok: browserInstalled(),
    detail: browserInstalled() ? "Playwright prêt" : "navigateurs non installés",
    fix: "pnpm exec playwright install chromium",
  },
  {
    id: "disk",
    tier: "optional",
    label: "Espace disque ≥ 2 Go",
    ok: disk === null || disk >= 2,
    detail: disk === null ? "inconnu" : `${String(disk)} Go libres`,
    fix: "Libérer de l'espace.",
  },
  {
    id: "port",
    tier: "optional",
    label: "Port 3000 libre (preview)",
    ok: previewPortFree,
    detail: previewPortFree ? "libre" : "déjà utilisé",
    fix: "Arrêter le serveur qui occupe le port 3000.",
  },
];

const essentialFailures = checks.filter((c) => c.tier === "essential" && !c.ok);
const optionalFailures = checks.filter((c) => c.tier === "optional" && !c.ok);

const canBuildSites = essentialFailures.length === 0;
const status = canBuildSites ? "ACE READY" : "ACE NOT READY";

/* -------------------------------------------------------------------------- */
/* Sortie                                                                     */
/* -------------------------------------------------------------------------- */

if (asJson) {
  console.log(
    JSON.stringify(
      {
        status,
        canBuildSites,
        checks: checks.map(({ id, tier, label, ok, detail }) => ({ id, tier, label, ok, detail })),
      },
      null,
      2,
    ),
  );
} else {
  const mark = (c) => (c.ok ? "✓" : "✗");
  console.log("");
  console.log(`  ${status}`);
  console.log("  " + "─".repeat(46));
  for (const c of checks) {
    console.log(`  ${mark(c)} ${c.label.padEnd(36)} ${c.detail}`);
  }
  console.log("");

  if (!canBuildSites) {
    console.log("  ⛔ ACE ne peut pas produire de site tant que ceci n'est pas réglé :");
    for (const c of essentialFailures) console.log(`     • ${c.label} → ${c.fix}`);
    console.log("");
  } else {
    console.log("  Tout est prêt. Ouvrez Claude et décrivez le site que vous voulez.");
    console.log("  Exemple : « Fais-moi un site premium pour cette entreprise : https://… »");
    console.log("");
    console.log("  Aucune clé, aucun abonnement, aucun crédit : ACE travaille à partir");
    console.log("  des médias réels (officiels, fournis, ou que vous lui donnez).");
    console.log("");
  }

  if (optionalFailures.length > 0) {
    console.log("  Confort (non bloquant) :");
    for (const c of optionalFailures) console.log(`     • ${c.label} → ${c.fix}`);
    console.log("");
  }
}

process.exit(canBuildSites ? 0 : 1);

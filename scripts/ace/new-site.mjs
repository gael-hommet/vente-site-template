#!/usr/bin/env node
/**
 * ace:new-site — generates a new client-site repository from this engine.
 *
 *   pnpm ace:new-site --name "Nom du site" --out ../mon-site [--preset onyx] [--url https://…]
 *
 * Guarantees:
 * - export via `git archive HEAD`: ONLY tracked files. Untracked state
 *   (.env*, node_modules, caches, reports, temp files) cannot leak.
 * - stamps ace.meta.json (engine version + source commit + preset) so the
 *   generated site can be diffed/upgraded against the template later.
 * - runtime identity via .env.local (name/url/preset) — no secrets involved.
 * - built-in leak check: refuses to finish if forbidden patterns are found.
 */

import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const opt = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};
const name = opt("--name");
const out = opt("--out");
const preset = opt("--preset") ?? "neutral";
const url = opt("--url");

const die = (msg) => {
  console.error(`✗ ${msg}`);
  process.exit(1);
};

if (!name) die('argument requis : --name "Nom du site"');
if (!out) die("argument requis : --out <dossier-cible>");

const KNOWN_PRESETS = ["neutral", "onyx", "atelier"];
if (!KNOWN_PRESETS.includes(preset)) {
  die(`preset inconnu "${preset}" (disponibles : ${KNOWN_PRESETS.join(", ")})`);
}

const target = path.resolve(process.cwd(), out);
if (existsSync(target) && readdirSync(target).length > 0) {
  die(`le dossier cible existe et n'est pas vide : ${target}`);
}

// ---------------------------------------------------------------------------
// Engine identity
// ---------------------------------------------------------------------------
const versionSource = readFileSync(path.join(ROOT, "src/ace/core/version.ts"), "utf8");
const aceVersion = versionSource.match(/ACE_VERSION = "([^"]+)"/)?.[1] ?? "0.0.0";
const commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT }).toString().trim();
const slug = name
  .toLowerCase()
  .normalize("NFD")
  .replace(/[̀-ͯ]/g, "")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/(^-|-$)/g, "");

console.log(`▸ ACE v${aceVersion} (${commit.slice(0, 7)}) → "${name}" [${preset}]`);

// ---------------------------------------------------------------------------
// Export tracked files only (git archive → tar → extract)
// ---------------------------------------------------------------------------
const staging = mkdtempSync(path.join(tmpdir(), "ace-new-site-"));
const tarPath = path.join(staging, "site.tar");
execFileSync("git", ["archive", "--format=tar", "-o", tarPath, "HEAD"], { cwd: ROOT });
const extracted = path.join(staging, "site");
mkdirSync(extracted, { recursive: true });
execFileSync("tar", ["-xf", tarPath, "-C", extracted]);
console.log("✓ export des fichiers trackés (git archive)");

// ---------------------------------------------------------------------------
// Prune engine-internal documents — planning/audit notes of the TEMPLATE repo
// (they reference other clients and engine history; a client site never
// ships them).
// ---------------------------------------------------------------------------
const ENGINE_ONLY = [
  "docs/audits",
  "docs/IMPLEMENTATION-PLAN.md",
  "docs/ACE-ARCHITECTURE-DECISION.md",
  "docs/RECOVERY-STATUS.md",
];
for (const rel of ENGINE_ONLY) {
  rmSync(path.join(extracted, rel), { recursive: true, force: true });
}
console.log(`✓ élagage des documents internes du moteur (${ENGINE_ONLY.length} entrées)`);

// ---------------------------------------------------------------------------
// Stamp the generated site
// ---------------------------------------------------------------------------
const pkgPath = path.join(extracted, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
pkg.name = slug || "ace-site";
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

writeFileSync(
  path.join(extracted, "ace.meta.json"),
  JSON.stringify(
    {
      engine: "Aurexia Cinematic Engine",
      engineVersion: aceVersion,
      sourceCommit: commit,
      preset,
      siteName: name,
      generatedAt: new Date().toISOString(),
    },
    null,
    2,
  ) + "\n",
);

const envLines = [
  "# Généré par ace:new-site — identité runtime du site (aucun secret ici).",
  `NEXT_PUBLIC_SITE_NAME="${name}"`,
  `NEXT_PUBLIC_ACE_PRESET="${preset}"`,
];
if (url) envLines.push(`NEXT_PUBLIC_SITE_URL="${url}"`);
writeFileSync(path.join(extracted, ".env.local"), envLines.join("\n") + "\n");
console.log("✓ stamp : ace.meta.json · package.json:name · .env.local");

// ---------------------------------------------------------------------------
// Leak check — nothing forbidden may ship in a generated site
// ---------------------------------------------------------------------------
const FORBIDDEN_FILES = [/^\.env$/, /^\.env\.production/, /\.pem$/, /^node_modules$/, /^\.git$/];
const SECRET_PATTERNS = [
  /sk-[A-Za-z0-9]{20,}/, // generic API secret shapes
  /AKIA[0-9A-Z]{16}/, // AWS access key
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
];
// Identities of OTHER clients must never ship in a generated site. Extend
// this list whenever a new client site is built from the engine.
const FOREIGN_IDENTITY_PATTERNS = [/in[ -]?quarto/i];
const MAX_FILE_BYTES = 500 * 1024;

const problems = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (FORBIDDEN_FILES.some((re) => re.test(entry.name))) {
      problems.push(`fichier interdit : ${path.relative(extracted, full)}`);
      continue;
    }
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    const size = statSync(full).size;
    if (size > MAX_FILE_BYTES) {
      problems.push(
        `fichier lourd (${Math.round(size / 1024)} Ko) : ${path.relative(extracted, full)}`,
      );
    }
    if (/\.(ts|tsx|js|mjs|json|md|env|local|yaml|yml|css)$/.test(entry.name) || size < 200_000) {
      const text = readFileSync(full, "utf8");
      for (const re of SECRET_PATTERNS) {
        if (re.test(text)) {
          problems.push(`motif de secret détecté dans ${path.relative(extracted, full)}`);
        }
      }
      for (const re of FOREIGN_IDENTITY_PATTERNS) {
        if (re.test(text)) {
          problems.push(`identité client étrangère dans ${path.relative(extracted, full)}`);
        }
      }
    }
  }
};
walk(extracted);

if (problems.length > 0) {
  console.error("✗ Contrôle de fuite ÉCHOUÉ :");
  for (const p of problems) console.error("  -", p);
  rmSync(staging, { recursive: true, force: true });
  process.exit(1);
}
console.log("✓ contrôle de fuite : aucun secret, aucun fichier interdit, aucun média lourd");

// ---------------------------------------------------------------------------
// Move into place
// ---------------------------------------------------------------------------
mkdirSync(target, { recursive: true });
cpSync(extracted, target, { recursive: true });
rmSync(staging, { recursive: true, force: true });

console.log(`\n✓ Site généré : ${target}\n`);
console.log("Étapes suivantes :");
console.log(`  cd ${target}`);
console.log("  git init && git add -A && git commit -m 'chore: bootstrap from ACE'");
console.log("  pnpm install");
console.log("  pnpm check          # lint + typecheck + tests + build");
console.log("  # puis : remplir input/CLIENT_BRIEF.md et lancer /build-site");

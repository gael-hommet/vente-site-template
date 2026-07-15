#!/usr/bin/env node
// pnpm audit:site — fast, read-only static audit used by the /audit-site skill.
// Checks structural SEO/a11y/perf hygiene. Does NOT modify anything.
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const c = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
};

let pass = 0;
let warn = 0;
let fail = 0;
const ok = (m) => (console.log(`  ${c.green("✔")} ${m}`), pass++);
const wa = (m) => (console.log(`  ${c.yellow("⚠")} ${m}`), warn++);
const fa = (m) => (console.log(`  ${c.red("✗")} ${m}`), fail++);

function has(p) {
  return existsSync(path.join(ROOT, p));
}
async function read(p) {
  try {
    return await readFile(path.join(ROOT, p), "utf8");
  } catch {
    return "";
  }
}
async function walkSrc(dir = "src") {
  const { readdir } = await import("node:fs/promises");
  const out = [];
  async function rec(d) {
    if (!existsSync(path.join(ROOT, d))) return;
    for (const e of await readdir(path.join(ROOT, d), { withFileTypes: true })) {
      const rel = path.join(d, e.name);
      if (e.isDirectory()) await rec(rel);
      else if (/\.(tsx?|mjs)$/.test(e.name)) out.push(rel);
    }
  }
  await rec(dir);
  return out;
}

async function main() {
  console.log(c.bold("\nAudit statique du site (lecture seule)\n"));

  console.log(c.bold("SEO"));
  has("src/app/sitemap.ts") ? ok("sitemap.ts présent") : fa("sitemap.ts manquant");
  has("src/app/robots.ts") ? ok("robots.ts présent") : fa("robots.ts manquant");
  has("src/lib/seo/metadata.ts")
    ? ok("système de metadata présent")
    : wa("src/lib/seo/metadata.ts manquant");
  has("src/lib/seo/jsonld.ts")
    ? ok("générateurs JSON-LD présents")
    : wa("src/lib/seo/jsonld.ts manquant");
  has("src/config/business.ts")
    ? ok("business.ts (source de vérité) présent")
    : fa("business.ts manquant");

  console.log(c.bold("\nAccessibilité"));
  const layout = await read("src/app/layout.tsx");
  /lang=/.test(layout)
    ? ok("attribut lang défini sur <html>")
    : wa("attribut lang absent de <html>");
  const files = await walkSrc();
  let skip = false;
  for (const f of files) {
    if (/SkipLink|skip-link/.test(await read(f))) {
      skip = true;
      break;
    }
  }
  skip ? ok("skip link détecté") : wa("aucun skip link détecté");

  console.log(c.bold("\nPerformance / hygiène"));
  let rawImg = 0;
  let consoleLogs = 0;
  for (const f of files) {
    if (!f.startsWith("src")) continue;
    const src = await read(f);
    if (/<img\s/.test(src)) rawImg++;
    if (/console\.log\(/.test(src)) consoleLogs++;
  }
  rawImg === 0
    ? ok("aucune balise <img> brute (next/image utilisé)")
    : wa(`${rawImg} fichier(s) avec <img> brut — préférez next/image`);
  consoleLogs === 0
    ? ok("aucun console.log résiduel")
    : wa(`${consoleLogs} fichier(s) contiennent console.log`);
  has(".env.example") ? ok(".env.example présent") : wa(".env.example manquant");

  console.log(c.bold("\nRésumé"));
  console.log(
    `  ${c.green(pass + " OK")}  ${c.yellow(warn + " avertissements")}  ${c.red(fail + " échecs")}`,
  );
  console.log(
    c.dim(
      "\n  Astuce: combinez avec `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:a11y` pour un audit complet.\n",
    ),
  );
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

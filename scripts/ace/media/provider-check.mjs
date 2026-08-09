#!/usr/bin/env node
/**
 * ace:provider:check — statut HONNÊTE des providers de génération média.
 *
 * Higgsfield se pilote par son CLI OFFICIEL `hf-api` (@higgsfield/cloud-cli).
 * Ce script constate des FAITS :
 *   1. le binaire est-il installé ?          (exécution de `hf-api --version`)
 *   2. une authentification est-elle active ? (`hf-api auth status`, exit 2 = non)
 *
 * Il n'affiche JAMAIS la valeur d'un credential, seulement sa présence, et ne
 * lit jamais un fichier `.env`.
 *
 * Sortie : 0 = au moins un provider PRÊT · 3 = aucun provider utilisable.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const asJson = process.argv.includes("--json");

/** Miroir de `KNOWN_PROVIDERS` (config.ts), sans importer de TS ici. */
const KNOWN = [
  {
    name: "higgsfield",
    bin: "hf-api",
    envBin: "HF_API_BIN",
    requiredEnv: "HIGGSFIELD_API_KEY",
    install: "npm i -g @higgsfield/cloud-cli",
    authCommand: "hf-api auth login",
    setupDoc: "docs/ACE-HIGGSFIELD-SETUP.md",
  },
];

function resolveBin(p) {
  const fromEnv = (process.env[p.envBin] ?? "").trim();
  if (fromEnv) return existsSync(fromEnv) ? fromEnv : null;
  const probe = spawnSync(p.bin, ["--version"], { stdio: "ignore" });
  return probe.error ? null : p.bin;
}

/** `hf-api auth status` : exit 0 = authentifié, exit 2 = non authentifié. */
function authStatus(bin) {
  const res = spawnSync(bin, ["auth", "status", "--json"], { encoding: "utf8" });
  if (res.error)
    return { authenticated: false, note: `exécution impossible : ${res.error.message}` };
  if (res.status === 0) return { authenticated: true, note: "authentification active" };
  const msg = (res.stderr ?? "").trim().split("\n")[0] || `exit ${String(res.status)}`;
  return { authenticated: false, note: msg };
}

const results = [];
for (const p of KNOWN) {
  const bin = resolveBin(p);
  const envPresent = (process.env[p.requiredEnv] ?? "").trim().length > 0;
  if (!bin) {
    results.push({
      name: p.name,
      status: "PROVIDER_NOT_CONFIGURED",
      cliInstalled: false,
      authenticated: false,
      envKeyPresent: envPresent,
      hint: `installer : ${p.install}`,
      setupDoc: p.setupDoc,
    });
    continue;
  }
  const auth = authStatus(bin);
  results.push({
    name: p.name,
    status: auth.authenticated ? "READY" : "PROVIDER_AUTH_PENDING",
    cliInstalled: true,
    authenticated: auth.authenticated,
    envKeyPresent: envPresent,
    hint: auth.authenticated ? null : `authentifier : ${p.authCommand}`,
    note: auth.note,
    setupDoc: p.setupDoc,
  });
}

const anyReady = results.some((r) => r.status === "READY");

if (asJson) {
  console.log(JSON.stringify({ providers: results, anyReady }, null, 2));
} else {
  console.log("ACE 0.2 — Statut des providers de génération\n");
  for (const r of results) {
    const mark = r.status === "READY" ? "✓" : "✗";
    console.log(`  ${mark} ${r.name} — ${r.status}`);
    console.log(`      CLI officiel installé : ${r.cliInstalled ? "oui" : "non"}`);
    console.log(`      Authentifié           : ${r.authenticated ? "oui" : "non"}`);
    // Présence seulement — jamais la valeur.
    console.log(`      HIGGSFIELD_API_KEY    : ${r.envKeyPresent ? "présente" : "absente"}`);
    if (r.note && !r.authenticated) console.log(`      détail : ${r.note}`);
    if (r.hint) console.log(`      → ${r.hint}`);
    console.log(`      doc : ${r.setupDoc}`);
  }
  if (!anyReady) {
    console.log(
      "\n  Aucun provider PRÊT. ACE reste pleinement capable de DÉCIDER, PLANIFIER,\n" +
        "  ASSEMBLER, OPTIMISER et CONTRÔLER des médias fournis — il ne GÉNÈRE pas\n" +
        "  d'images/vidéos sans provider authentifié. Aucune génération n'est simulée.",
    );
  }
}

process.exit(anyReady ? 0 : 3);

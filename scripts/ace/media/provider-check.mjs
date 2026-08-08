#!/usr/bin/env node
/**
 * ace:provider:check — statut HONNÊTE des providers de génération média.
 *
 * Ne teste PAS un appel réseau réel (pas d'authentification simulée) : rapporte
 * seulement si les credentials attendus sont présents dans l'environnement.
 * Un provider sans credential est signalé PROVIDER_NOT_CONFIGURED, jamais
 * présenté comme fonctionnel.
 *
 * `--higgsfield` limite au provider Higgsfield.
 */
const KNOWN = [
  {
    name: "higgsfield",
    requiredEnv: "HIGGSFIELD_API_KEY",
    optionalEnv: ["HIGGSFIELD_BASE_URL", "HIGGSFIELD_MODEL"],
    setupDoc: "docs/ACE-HIGGSFIELD-SETUP.md",
  },
];

const only = process.argv.includes("--higgsfield") ? "higgsfield" : null;
const providers = only ? KNOWN.filter((p) => p.name === only) : KNOWN;

let anyConfigured = false;
console.log("ACE 0.2 — Statut des providers de génération\n");
for (const p of providers) {
  const configured = (process.env[p.requiredEnv] ?? "").trim().length > 0;
  anyConfigured ||= configured;
  const status = configured ? "READY" : "PROVIDER_NOT_CONFIGURED";
  console.log(`  ${configured ? "✓" : "✗"} ${p.name} — ${status}`);
  // On n'affiche JAMAIS la valeur du credential, seulement sa présence.
  console.log(`      ${p.requiredEnv} : ${configured ? "présent" : "absent"}`);
  const optionalPresent = (p.optionalEnv ?? []).filter(
    (e) => (process.env[e] ?? "").trim().length > 0,
  );
  if (optionalPresent.length)
    console.log(`      optionnels présents : ${optionalPresent.join(", ")}`);
  if (!configured) console.log(`      → configurer : voir ${p.setupDoc}`);
}

if (!anyConfigured) {
  console.log(
    "\n  Aucun provider configuré. ACE reste capable de DÉCIDER, PLANIFIER et ASSEMBLER" +
      " des médias fournis, mais ne GÉNÈRE pas d'images/vidéos sans provider.",
  );
}

// Code de sortie : 0 si au moins un configuré, 3 sinon (utile en CI/scripts).
process.exit(anyConfigured ? 0 : 3);

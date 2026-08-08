/**
 * ACE 0.2 — Config média (lecture d'environnement UNIQUEMENT).
 *
 * Lit `process.env.*` pour savoir quels providers sont configurés. Ne lit
 * JAMAIS les fichiers `.env` (gitignorés, sensibles) : c'est le runtime qui les
 * charge dans l'environnement. Ne logue jamais une valeur de credential.
 */

/** Un provider connu + la variable d'env qui l'active. */
export interface ProviderEnvSpec {
  name: string;
  /** Variable requise (présente et non vide ⇒ configuré). */
  requiredEnv: string;
  /** Variables optionnelles (base URL, modèle…). */
  optionalEnv?: string[];
  /** Doc de setup. */
  setupDoc: string;
}

/** Providers de génération connus (l'architecture en accueille d'autres). */
export const KNOWN_PROVIDERS: readonly ProviderEnvSpec[] = [
  {
    name: "higgsfield",
    requiredEnv: "HIGGSFIELD_API_KEY",
    optionalEnv: ["HIGGSFIELD_BASE_URL", "HIGGSFIELD_MODEL"],
    setupDoc: "docs/ACE-HIGGSFIELD-SETUP.md",
  },
];

function envValue(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim().length > 0 ? v : undefined;
}

/** true si le provider est réellement configuré (credential présent). */
export function isProviderConfigured(name: string): boolean {
  const spec = KNOWN_PROVIDERS.find((p) => p.name === name);
  if (!spec) return false;
  return envValue(spec.requiredEnv) !== undefined;
}

/** Liste des providers configurés (via env). */
export function configuredProviders(): string[] {
  return KNOWN_PROVIDERS.filter((p) => isProviderConfigured(p.name)).map((p) => p.name);
}

/** Liste des providers connus mais NON configurés. */
export function unconfiguredProviders(): string[] {
  return KNOWN_PROVIDERS.filter((p) => !isProviderConfigured(p.name)).map((p) => p.name);
}

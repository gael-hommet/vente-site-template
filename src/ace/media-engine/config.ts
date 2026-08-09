/**
 * ACE 0.2 — Config média (lecture d'environnement UNIQUEMENT).
 *
 * Lit `process.env.*` pour savoir quels providers sont configurés. Ne lit
 * JAMAIS les fichiers `.env` (gitignorés, sensibles) : c'est le runtime qui les
 * charge dans l'environnement. Ne logue jamais une valeur de credential.
 */

/** Un provider connu, son outil officiel et la variable d'env qui l'active. */
export interface ProviderEnvSpec {
  name: string;
  /** Variable d'env qui porte le credential (une des voies d'activation). */
  requiredEnv: string;
  /** Variables optionnelles. */
  optionalEnv?: string[];
  /** Outil officiel (CLI) qui pilote le provider, si applicable. */
  officialCli?: { bin: string; install: string; authCommand: string };
  /** Doc de setup. */
  setupDoc: string;
}

/**
 * Providers de génération connus (l'architecture en accueille d'autres).
 *
 * Higgsfield se pilote via son CLI OFFICIEL `hf-api` (`@higgsfield/cloud-cli`),
 * conçu pour être opéré par un agent autonome. L'authentification a DEUX voies
 * également valables : la variable `HIGGSFIELD_API_KEY` (format
 * `<api_key_id>:<secret>`) ou un `hf-api auth login` déjà effectué (clé stockée
 * localement par le CLI).
 */
export const KNOWN_PROVIDERS: readonly ProviderEnvSpec[] = [
  {
    name: "higgsfield",
    requiredEnv: "HIGGSFIELD_API_KEY",
    officialCli: {
      bin: "hf-api",
      install: "npm i -g @higgsfield/cloud-cli",
      authCommand: "hf-api auth login",
    },
    setupDoc: "docs/ACE-HIGGSFIELD-SETUP.md",
  },
];

function envValue(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim().length > 0 ? v : undefined;
}

/**
 * true si un credential est présent DANS L'ENVIRONNEMENT pour ce provider.
 *
 * ⚠️ Ce n'est qu'UNE des voies d'activation : un provider peut aussi être
 * authentifié via son CLI officiel (`hf-api auth login`), ce que cette fonction
 * isomorphe ne peut pas constater. Le statut faisant autorité est celui du
 * provider câblé côté Node (`wireProviders` → `provider.status()`).
 */
export function isProviderEnvConfigured(name: string): boolean {
  const spec = KNOWN_PROVIDERS.find((p) => p.name === name);
  if (!spec) return false;
  return envValue(spec.requiredEnv) !== undefined;
}

/** @deprecated Nom ambigu — préférer `isProviderEnvConfigured`. */
export const isProviderConfigured = isProviderEnvConfigured;

/** Liste des providers configurés (via env). */
export function configuredProviders(): string[] {
  return KNOWN_PROVIDERS.filter((p) => isProviderConfigured(p.name)).map((p) => p.name);
}

/** Liste des providers connus mais NON configurés. */
export function unconfiguredProviders(): string[] {
  return KNOWN_PROVIDERS.filter((p) => !isProviderConfigured(p.name)).map((p) => p.name);
}

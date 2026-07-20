import { clientConfigSchema, type ClientConfig, type ClientConfigInput } from "./client-schema";
import { findFeatureConflicts, resolveFeatures, type ResolvedFeatures } from "./features";
import { validateRecipeSelection } from "@/ace/recipes/catalog";

/**
 * Charge et valide une configuration client. Applique les défauts (parsing Zod),
 * puis vérifie les combinaisons de features incompatibles. Retourne la config
 * résolue + l'ensemble booléen de features prêt à consommer.
 *
 * Lève une erreur claire si la config est invalide ou incohérente : le
 * générateur s'appuie dessus pour échouer proprement (quality gate d'entrée).
 */
export interface LoadedClientConfig {
  config: ClientConfig;
  features: ResolvedFeatures;
}

export class ClientConfigError extends Error {
  constructor(
    message: string,
    readonly issues: string[],
  ) {
    super(message);
    this.name = "ClientConfigError";
  }
}

export function loadClientConfig(input: ClientConfigInput): LoadedClientConfig {
  const parsed = clientConfigSchema.safeParse(input);
  if (!parsed.success) {
    const issues = parsed.error.issues.map(
      (i) => `${i.path.join(".") || "(racine)"} : ${i.message}`,
    );
    throw new ClientConfigError(
      `Configuration client invalide (${issues.length} problème(s)).`,
      issues,
    );
  }
  const config = parsed.data;

  const conflicts = findFeatureConflicts(config);
  if (conflicts.length > 0) {
    throw new ClientConfigError(
      `Combinaisons de features incompatibles (${conflicts.length}).`,
      conflicts.map((c) => `${c.feature} : ${c.message}`),
    );
  }

  // Les recipes sélectionnées doivent exister (sinon échec propre).
  const recipeIssues = validateRecipeSelection(config.recipes);
  if (recipeIssues.length > 0) {
    throw new ClientConfigError(
      `Recipe(s) inconnue(s) (${recipeIssues.length}).`,
      recipeIssues.map((i) => `${i.family}="${i.id}" inconnu (dispo : ${i.available.join(", ")}).`),
    );
  }

  return { config, features: resolveFeatures(config) };
}

/** Validation « douce » : renvoie le résultat sans lever (pour un rapport/UI). */
export function inspectClientConfig(input: ClientConfigInput):
  | { ok: true; loaded: LoadedClientConfig }
  | { ok: false; issues: string[] } {
  try {
    return { ok: true, loaded: loadClientConfig(input) };
  } catch (e) {
    if (e instanceof ClientConfigError) return { ok: false, issues: e.issues };
    return { ok: false, issues: [String(e)] };
  }
}

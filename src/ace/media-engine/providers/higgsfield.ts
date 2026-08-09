import type { GenerateRequest, MediaProvider, ProviderResult, ProviderStatus } from "./types";

/**
 * ACE 0.2 — Adapter Higgsfield, bâti sur le CLI OFFICIEL `hf-api`.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * POURQUOI PAS DE REST ICI
 * Une version antérieure de cet adapter appelait un endpoint REST supposé
 * (`https://api.higgsfield.ai/v1/generations`). Cet endpoint n'a JAMAIS été
 * vérifié et l'audit a montré qu'il ne sert pas d'API (HTTP 521). Il a été
 * supprimé : ACE n'invente pas de contrat d'API.
 *
 * La voie officielle réellement disponible est le CLI `hf-api`
 * (`@higgsfield/cloud-cli`, github.com/higgsfield-ai/cloud-cli), explicitement
 * « designed to be operated by an autonomous agent ». Son contrat de commande a
 * été vérifié en l'exécutant. Voir `../node/hf-cli.ts` (module Node) pour le
 * détail et docs/ACE-HIGGSFIELD-SETUP.md pour l'installation.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * Ce module reste ISOMORPHE (aucun `node:*`) : il décrit le provider et délègue
 * l'exécution réelle à un pilote injecté par la CLI Node
 * (`setHiggsfieldRuntime`). Sans pilote, il refuse proprement — jamais de faux
 * succès, jamais de génération simulée.
 */

/** État réel du provider, renseigné côté Node (jamais deviné). */
export interface HiggsfieldRuntime {
  /** Le binaire `hf-api` est installé et exécutable. */
  cliAvailable: boolean;
  /** Une authentification active a été confirmée (`hf-api auth status`). */
  authenticated: boolean;
  /** Pilote de génération réel, fourni par la CLI Node. */
  generate?: (req: GenerateRequest) => Promise<ProviderResult>;
}

const UNKNOWN_RUNTIME: HiggsfieldRuntime = { cliAvailable: false, authenticated: false };

let runtime: HiggsfieldRuntime = { ...UNKNOWN_RUNTIME };

/**
 * Renseigne l'état réel du provider (appelé depuis la CLI Node après avoir
 * interrogé `hf-api`). Le bundle client ne teste jamais un binaire.
 */
export function setHiggsfieldRuntime(next: Partial<HiggsfieldRuntime>): void {
  runtime = { ...runtime, ...next };
}

/** Réinitialise l'état (tests, et pour éviter toute fuite entre exécutions). */
export function resetHiggsfieldRuntime(): void {
  runtime = { ...UNKNOWN_RUNTIME };
}

export const higgsfieldProvider: MediaProvider = {
  name: "higgsfield",
  capabilities: ["generate-image", "generate-video"],

  status(): ProviderStatus {
    if (!runtime.cliAvailable) return "PROVIDER_NOT_CONFIGURED";
    if (!runtime.authenticated) return "PROVIDER_AUTH_PENDING";
    return "READY";
  },

  async generate(req: GenerateRequest): Promise<ProviderResult> {
    if (!runtime.cliAvailable) {
      return {
        ok: false,
        code: "PROVIDER_NOT_CONFIGURED",
        message:
          "Higgsfield indisponible : le CLI officiel `hf-api` n'est pas installé. " +
          "Installer avec `npm i -g @higgsfield/cloud-cli` (voir docs/ACE-HIGGSFIELD-SETUP.md). " +
          "Aucune génération n'est simulée.",
      };
    }
    if (!runtime.authenticated) {
      return {
        ok: false,
        code: "PROVIDER_AUTH_PENDING",
        message:
          "Higgsfield : CLI installé mais aucune authentification active. " +
          "Exécuter `hf-api auth login` ou définir HIGGSFIELD_API_KEY. " +
          "Aucune génération n'est simulée.",
      };
    }
    if (!runtime.generate) {
      return {
        ok: false,
        code: "PROVIDER_CONTRACT_UNVERIFIED",
        message:
          "Higgsfield authentifié mais aucun pilote de génération n'est branché " +
          "dans ce contexte d'exécution (la génération passe par la CLI Node ACE).",
      };
    }
    return runtime.generate(req);
  },
};

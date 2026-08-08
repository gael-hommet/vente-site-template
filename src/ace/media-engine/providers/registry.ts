import type { MediaProvider, ProviderCapability } from "./types";
import { localProvider } from "./local";
import { higgsfieldProvider } from "./higgsfield";

/**
 * ACE 0.2 — Registre de providers (pluggable, fail-safe).
 *
 * L'architecture n'est jamais codée en dur pour un seul outil. On enregistre
 * les adapters ici ; en ajouter un futur (upscaling, interpolation…) se fait
 * sans toucher au reste. Un provider absent/non configuré ne casse jamais le
 * moteur : il est simplement filtré par son `status()`.
 */

const PROVIDERS: readonly MediaProvider[] = [localProvider, higgsfieldProvider];

export function allProviders(): readonly MediaProvider[] {
  return PROVIDERS;
}

export function getProvider(name: string): MediaProvider | undefined {
  return PROVIDERS.find((p) => p.name === name);
}

/** Providers prêts à l'emploi (statut READY). */
export function readyProviders(): MediaProvider[] {
  return PROVIDERS.filter((p) => p.status() === "READY");
}

/** Providers capables d'une opération donnée ET prêts. */
export function providersFor(capability: ProviderCapability): MediaProvider[] {
  return readyProviders().filter((p) => p.capabilities.includes(capability));
}

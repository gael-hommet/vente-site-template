import type { GenerateRequest, MediaProvider, ProviderResult, ProviderStatus } from "./types";
import { isProviderConfigured } from "../config";

/**
 * ACE 0.2 — Adapter Higgsfield (GUARDÉ, honnête, jamais simulé).
 *
 * HONNÊTETÉ TECHNIQUE : le contrat exact de l'API Higgsfield n'est pas
 * vérifiable dans cet environnement (aucune credential, aucun accès réseau
 * validé). Cet adapter :
 *   - déclare ses capacités et son statut RÉEL (configuré ou non) ;
 *   - encapsule proprement l'appel réseau (endpoint/headers/payload
 *     paramétrables par env) ;
 *   - N'INVENTE JAMAIS un succès : sans credential → PROVIDER_NOT_CONFIGURED ;
 *   - marque explicitement le corps de génération comme À VALIDER contre la
 *     vraie API (le mapping payload/réponse doit être confirmé avant usage réel).
 *
 * Config via env (jamais via lecture de .env par le moteur) :
 *   HIGGSFIELD_API_KEY   (requis)
 *   HIGGSFIELD_BASE_URL  (optionnel, défaut ci-dessous)
 *   HIGGSFIELD_MODEL     (optionnel)
 */

const DEFAULT_BASE_URL = "https://api.higgsfield.ai/v1";

export const higgsfieldProvider: MediaProvider = {
  name: "higgsfield",
  capabilities: ["generate-image", "generate-video"],

  status(): ProviderStatus {
    return isProviderConfigured("higgsfield") ? "READY" : "PROVIDER_NOT_CONFIGURED";
  },

  async generate(req: GenerateRequest): Promise<ProviderResult> {
    if (!isProviderConfigured("higgsfield")) {
      return {
        ok: false,
        code: "PROVIDER_NOT_CONFIGURED",
        message:
          "Higgsfield non configuré : définir HIGGSFIELD_API_KEY dans l'environnement. " +
          "Voir docs/ACE-HIGGSFIELD-SETUP.md. Aucune génération simulée.",
      };
    }

    const apiKey = process.env.HIGGSFIELD_API_KEY as string;
    const baseUrl = process.env.HIGGSFIELD_BASE_URL?.trim() || DEFAULT_BASE_URL;
    const model = process.env.HIGGSFIELD_MODEL?.trim();

    // ⚠️ À VALIDER CONTRE LA VRAIE API. Le schéma exact (endpoint, champs,
    // format de réponse, polling asynchrone) doit être confirmé avant un usage
    // réel. On échoue proprement plutôt que de prétendre un succès.
    try {
      const res = await fetch(`${baseUrl}/generations`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          prompt: req.prompt,
          reference_image: req.referenceImage,
          // Paramètres dérivés du plan (à mapper sur le schéma réel du provider).
          shot: req.shot.id,
          camera: req.shot.cameraMove,
          duration_s: req.shot.durationS,
        }),
      });

      if (!res.ok) {
        return {
          ok: false,
          code: "GENERATION_FAILED",
          message: `Higgsfield a répondu ${res.status} ${res.statusText}. Vérifier le contrat d'API (docs).`,
        };
      }

      const data: unknown = await res.json();
      // Le mapping data → outputs dépend du schéma réel : tant qu'il n'est pas
      // confirmé, on signale explicitement plutôt que d'inventer des chemins.
      return {
        ok: false,
        code: "GENERATION_FAILED",
        message:
          "Réponse reçue mais le mapping du schéma de réponse Higgsfield reste À CONFIRMER " +
          "(voir docs/ACE-HIGGSFIELD-SETUP.md). Adapter `outputs` au format réel avant usage. " +
          `Aperçu clés reçues : ${data && typeof data === "object" ? Object.keys(data as object).join(", ") : typeof data}.`,
      };
    } catch (e) {
      return {
        ok: false,
        code: "GENERATION_FAILED",
        message: `Appel Higgsfield échoué (réseau/env) : ${e instanceof Error ? e.message : String(e)}.`,
      };
    }
  },
};

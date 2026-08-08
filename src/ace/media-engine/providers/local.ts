import type { MediaProvider, ProviderStatus } from "./types";

/**
 * ACE 0.2 — Provider LOCAL (traitement réel via ffmpeg / sharp / gltf-transform).
 *
 * Ce provider ne GÉNÈRE pas de pixels (pas d'IA) : il ASSEMBLE, extrait des
 * frames et optimise des médias existants. Les opérations lourdes vivent dans
 * la CLI Node (`scripts/ace/media/*`) qui a accès aux binaires ; ce module
 * déclare les capacités et le statut (les dépendances sont-elles présentes ?).
 *
 * Le statut réel des binaires est fourni par l'appelant (Node) via
 * `setLocalToolAvailability`, car la détection dépend de l'environnement
 * d'exécution (le bundle client ne teste jamais un binaire).
 */

interface LocalTools {
  ffmpeg: boolean;
  sharp: boolean;
  gltfTransform: boolean;
}

// Par défaut inconnu (false) : c'est la CLL qui renseigne l'état réel.
let tools: LocalTools = { ffmpeg: false, sharp: false, gltfTransform: false };

/** Renseigne l'état réel des binaires (appelé depuis la CLI Node). */
export function setLocalToolAvailability(next: Partial<LocalTools>): void {
  tools = { ...tools, ...next };
}

export const localProvider: MediaProvider = {
  name: "local",
  capabilities: ["extract-frames", "assemble-video", "optimize"],
  status(): ProviderStatus {
    // Utilisable si au moins ffmpeg est présent (assemblage/frames).
    return tools.ffmpeg ? "READY" : "UNAVAILABLE";
  },
  // Pas de `generate` : le provider local ne fait pas de génération IA.
};

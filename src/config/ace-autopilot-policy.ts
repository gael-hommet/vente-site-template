/**
 * ACE AUTOPILOT — politique d'autonomie et de dépense.
 *
 * UN SEUL endroit pour décider jusqu'où ACE va tout seul. Ce fichier est fait
 * pour être relu et ajusté par l'administrateur : chaque valeur est explicite
 * et commentée. Aucune de ces bornes n'est contournable par le workflow.
 *
 * Principe : une dépense faible et prévisible ⇒ ACE continue seul ; au-dessus
 * du seuil ⇒ UNE question, une seule, en langage clair. Jamais vingt.
 */

export interface AutopilotPolicy {
  spend: {
    /**
     * Seuil au-dessus duquel une confirmation humaine est demandée, pour la
     * TOTALITÉ de la mission. Unité : devise du provider.
     */
    approvalThreshold: number;
    /** Plafond absolu : la mission s'arrête, même approuvée. */
    hardCap: number;
    /** Générations maximum par site (garde-fou anti-emballement). */
    maxGenerationsPerSite: number;
    /** Tentatives maximum par plan avant d'abandonner ce plan. */
    maxAttemptsPerShot: number;
  };
  quality: {
    /** Itérations visuelles maximum (évite la boucle infinie). */
    maxVisualIterations: number;
    /** Score ACE minimal pour considérer un site livrable. */
    minScore: number;
  };
  provider: {
    /** Provider privilégié quand plusieurs sont prêts. */
    preferred: string;
    /**
     * Comportement quand AUCUN provider n'est authentifié.
     * - "block-if-media-required" : bloquer proprement (jamais de 3D cheap) ;
     * - "editorial-only" : produire un site éditorial premium sans média généré.
     */
    whenUnavailable: "block-if-media-required" | "editorial-only";
  };
  autonomy: {
    /** Actions qu'ACE peut faire sans demander. */
    allowed: readonly string[];
    /** Actions qui exigent TOUJOURS une demande explicite de l'utilisateur. */
    forbidden: readonly string[];
  };
}

/**
 * Valeurs par défaut : volontairement prudentes.
 * `approvalThreshold` est bas exprès — mieux vaut une question de trop qu'une
 * facture surprise.
 */
export const AUTOPILOT_POLICY: AutopilotPolicy = {
  spend: {
    approvalThreshold: 5,
    hardCap: 50,
    maxGenerationsPerSite: 24,
    maxAttemptsPerShot: 3,
  },
  quality: {
    maxVisualIterations: 3,
    minScore: 0.75,
  },
  provider: {
    preferred: "higgsfield",
    // Par défaut on NE dégrade pas silencieusement : si un média premium est
    // indispensable et qu'aucun provider n'est prêt, on bloque et on le dit.
    whenUnavailable: "block-if-media-required",
  },
  autonomy: {
    allowed: [
      "créer et modifier des fichiers du projet",
      "installer des dépendances raisonnables",
      "générer et optimiser des assets",
      "lancer lint, typecheck, tests et build",
      "démarrer un serveur de preview local",
      "corriger ses propres erreurs",
      "supprimer ses fichiers temporaires",
      "itérer sur le design",
    ],
    forbidden: [
      "pousser sur GitHub",
      "rendre un dépôt public",
      "déployer en production",
      "modifier un DNS",
      "acheter un domaine",
      "dépenser au-dessus du seuil sans accord",
      "utiliser des credentials absents",
      "publier officiellement le site d'un client",
      "inventer des informations client",
    ],
  },
};

/** Une action fait-elle partie des interdits absolus ? */
export function isForbiddenAction(
  action: string,
  policy: AutopilotPolicy = AUTOPILOT_POLICY,
): boolean {
  const needle = action.toLowerCase();
  return policy.autonomy.forbidden.some((f) =>
    needle.includes(f.toLowerCase().split(" ")[0] ?? ""),
  );
}

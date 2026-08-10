/**
 * ACE AUTOPILOT — politique d'autonomie et de dépense.
 *
 * UN SEUL endroit pour décider jusqu'où ACE va tout seul. Ce fichier est fait
 * pour être relu et ajusté par l'administrateur : chaque valeur est explicite
 * et commentée. Aucune de ces bornes n'est contournable par le workflow.
 *
 * Principe : ACE travaille à COÛT MÉDIA NUL. Il n'appelle aucun service payant
 * de génération. Ce fichier borne donc la QUALITÉ et l'AUTONOMIE, pas la
 * dépense.
 */

export interface AutopilotPolicy {
  assets: {
    /**
     * Que faire quand aucun visuel réel n'existe pour un parti-pris porté par
     * l'image ?
     * - "ask"                : demander le média manquant (bloque proprement) ;
     * - "editorial-fallback" : basculer sur un parti-pris éditorial assumé.
     */
    whenNoVisual: "ask" | "editorial-fallback";
    /** Nombre max de visuels importés depuis les sources officielles. */
    maxImportedAssets: number;
  };
  quality: {
    /** Itérations visuelles maximum (évite la boucle infinie). */
    maxVisualIterations: number;
    /** Score ACE minimal pour considérer un site livrable. */
    minScore: number;
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
 *
 * Il n'y a AUCUN seuil de dépense : ACE ne dépense rien pour les médias.
 */
export const AUTOPILOT_POLICY: AutopilotPolicy = {
  assets: {
    whenNoVisual: "ask",
    maxImportedAssets: 24,
  },
  quality: {
    maxVisualIterations: 3,
    minScore: 0.75,
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

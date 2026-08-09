/**
 * ACE 0.2 — REFERENCE LOCK SYSTEM (verrou d'identité du sujet).
 *
 * Problème réel : un chalet généré au plan 1 ne doit pas devenir une AUTRE
 * maison au plan 2. Sans verrou, chaque génération repart d'un prompt et
 * réinvente le sujet — la continuité premium est alors impossible.
 *
 * Le lock décrit ce qui NE DOIT PAS changer d'un plan à l'autre, et accumule
 * les visuels approuvés : le plan N accepté devient une référence forte du plan
 * N+1. Structure persistée par `node/reference-store.ts` :
 *
 *   research/media/<subject-id>/
 *     reference-lock.json
 *     source/       ← références fournies par le client
 *     approved/     ← sorties validées (deviennent références)
 *     rejected/     ← sorties refusées (traçabilité, jamais livrées)
 *     continuity/   ← frames de raccord extraites (fin de N / début de N+1)
 *
 * AUCUN FAIT CLIENT INVENTÉ : le lock ne contient que ce qui a été fourni ou
 * observé. Un champ inconnu reste vide plutôt que rempli au jugé.
 */

export interface AceReferenceLock {
  /** Identifiant stable du sujet (kebab-case). */
  subjectId: string;
  /** Description canonique — la même à chaque plan. */
  canonicalDescription: string;
  /** Chemins des références visuelles sources (fournies, non générées). */
  sourceReferences: string[];
  /** Sorties approuvées, réutilisables comme référence forte. */
  approvedReferences: string[];
  /** Invariants d'identité : ce qui doit rester identique. */
  invariants: {
    architecture?: string;
    silhouette?: string;
    materials?: string[];
    colors?: string[];
    timeOfDay?: string;
    lighting?: string;
    cameraLanguage?: string;
    /** Éléments qui doivent être présents dans chaque plan. */
    mustInclude?: string[];
  };
  /** Contraintes négatives : ce qui ne doit JAMAIS apparaître. */
  negativeConstraints: string[];
  /** ISO 8601, renseigné par l'appelant. */
  updatedAt: string | null;
}

/** Crée un lock vide et honnête (aucun invariant deviné). */
export function createReferenceLock(
  subjectId: string,
  canonicalDescription: string,
): AceReferenceLock {
  return {
    subjectId,
    canonicalDescription,
    sourceReferences: [],
    approvedReferences: [],
    invariants: {},
    negativeConstraints: [],
    updatedAt: null,
  };
}

/**
 * Référence à utiliser pour le prochain plan : la dernière sortie approuvée
 * (continuité maximale), sinon une référence source, sinon aucune.
 */
export function strongestReference(lock: AceReferenceLock): string | null {
  const lastApproved = lock.approvedReferences.at(-1);
  if (lastApproved) return lastApproved;
  return lock.sourceReferences[0] ?? null;
}

/**
 * Fragment de contrainte injecté dans chaque prompt pour tenir l'identité.
 * Déterministe : le même lock produit toujours le même texte.
 */
export function lockPromptFragment(lock: AceReferenceLock): string {
  const parts: string[] = [lock.canonicalDescription.trim()].filter(Boolean);
  const inv = lock.invariants;
  if (inv.architecture) parts.push(`architecture : ${inv.architecture}`);
  if (inv.silhouette) parts.push(`silhouette : ${inv.silhouette}`);
  if (inv.materials?.length) parts.push(`matériaux : ${inv.materials.join(", ")}`);
  if (inv.colors?.length) parts.push(`palette : ${inv.colors.join(", ")}`);
  if (inv.timeOfDay) parts.push(`heure : ${inv.timeOfDay}`);
  if (inv.lighting) parts.push(`lumière : ${inv.lighting}`);
  if (inv.cameraLanguage) parts.push(`caméra : ${inv.cameraLanguage}`);
  if (inv.mustInclude?.length) parts.push(`éléments obligatoires : ${inv.mustInclude.join(", ")}`);
  return parts.join(" · ");
}

/** Contraintes négatives, prêtes à alimenter un paramètre `negative_prompt`. */
export function negativePromptFragment(lock: AceReferenceLock): string {
  return lock.negativeConstraints.join(", ");
}

export interface LockIntegrityReport {
  /** Le lock est-il exploitable pour tenir une continuité ? */
  usable: boolean;
  /** Points faibles qui menacent la continuité. */
  weaknesses: string[];
}

/**
 * Un lock sans description ni référence visuelle ne peut PAS tenir l'identité
 * d'un sujet à travers plusieurs plans. Le dire plutôt que de le subir.
 */
export function assessLockIntegrity(lock: AceReferenceLock): LockIntegrityReport {
  const weaknesses: string[] = [];
  if (!lock.canonicalDescription.trim()) {
    weaknesses.push("Aucune description canonique : chaque plan réinventera le sujet.");
  }
  if (lock.sourceReferences.length === 0 && lock.approvedReferences.length === 0) {
    weaknesses.push(
      "Aucune référence visuelle (source ni approuvée) : la continuité repose seulement sur le texte.",
    );
  }
  const inv = lock.invariants;
  const invariantCount = [
    inv.architecture,
    inv.silhouette,
    inv.materials?.length,
    inv.colors?.length,
    inv.timeOfDay,
    inv.lighting,
  ].filter(Boolean).length;
  if (invariantCount < 2) {
    weaknesses.push(
      "Moins de deux invariants déclarés : dérive d'identité probable entre les plans.",
    );
  }
  return {
    // Une référence visuelle OU une description + invariants rendent le lock exploitable.
    usable:
      lock.sourceReferences.length + lock.approvedReferences.length > 0 ||
      (lock.canonicalDescription.trim().length > 0 && invariantCount >= 2),
    weaknesses,
  };
}

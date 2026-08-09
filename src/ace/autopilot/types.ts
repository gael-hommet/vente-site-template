/**
 * ACE AUTOPILOT — contrats de mission.
 *
 * AUTOPILOT est la couche qui rend ACE utilisable par une personne NON
 * TECHNIQUE : une phrase en langage naturel suffit. Elle ne remplace rien
 * (générateur, media-engine, providers, tests) : elle les COMMANDE.
 *
 * Répartition des rôles, assumée :
 *  - AUTOPILOT (déterministe) : machine à états, persistance, garde-fous
 *    (coût, provider, faits, qualité), exécution des commandes, rapports ;
 *  - L'AGENT (Claude) : ce qu'aucun script ne peut faire — recherche publique,
 *    jugement éditorial, direction artistique fine, revue visuelle.
 * L'état note explicitement ce qui a été produit par l'agent (`agentSupplied`),
 * pour ne jamais faire passer une saisie humaine pour un calcul automatique.
 */

/** États de la mission. L'ordre est celui du workflow nominal. */
export const AUTOPILOT_STATES = [
  "INTAKE",
  "RESEARCH",
  "FACT_CHECK",
  "SITE_BOOTSTRAP",
  "ART_DIRECTION",
  "CONTENT",
  "MEDIA_PLAN",
  "MEDIA_GENERATION",
  "MEDIA_QA",
  "SITE_BUILD",
  "VISUAL_QA",
  "MOBILE_QA",
  "TECHNICAL_QA",
  "PREVIEW",
  "COMPLETE",
  "BLOCKED",
  "WAITING_FOR_APPROVAL",
] as const;

export type AutopilotState = (typeof AUTOPILOT_STATES)[number];

/** États terminaux : la machine ne progresse plus d'elle-même. */
export const TERMINAL_STATES: readonly AutopilotState[] = [
  "COMPLETE",
  "BLOCKED",
  "WAITING_FOR_APPROVAL",
];

/** Raisons de blocage — lisibles par un humain non technique. */
export type BlockedReason =
  /** L'administrateur doit authentifier le provider média (une seule fois). */
  | "ADMIN_PROVIDER_AUTH_REQUIRED"
  /** Une information indispensable est introuvable et non déductible. */
  | "MISSING_ESSENTIAL_INFO"
  /** Un média externe est requis et aucun provider ne peut le produire. */
  | "MEDIA_ASSET_REQUIRED"
  /** La dépense dépasse le seuil : une confirmation humaine est requise. */
  | "SPEND_APPROVAL_REQUIRED"
  /** L'environnement n'est pas prêt (voir `ace:doctor`). */
  | "ENVIRONMENT_NOT_READY"
  /** Trop d'itérations sans atteindre la barre de qualité. */
  | "QUALITY_NOT_REACHED"
  /** Échec technique non récupérable automatiquement. */
  | "UNRECOVERABLE_ERROR";

/** Ce que l'utilisateur veut, extrait de sa phrase. */
export interface AutopilotIntent {
  /** Est-ce bien une demande de création/refonte de site ? */
  isSiteMission: boolean;
  /** Confiance 0..1 de la détection. */
  confidence: number;
  /** Nom de l'entreprise si identifiable. */
  businessName: string | null;
  /** URL fournie (site existant, réseau social…). */
  sourceUrl: string | null;
  /** Secteur deviné (aligné sur les INDUSTRIES du schéma client). */
  industry: string | null;
  /** Mots-clés de style demandés (« chaleureux », « très haut de gamme »…). */
  styleHints: string[];
  /** Nature de la livraison. */
  deliverable: "demo" | "redesign" | "new-site";
  /** Langue du site. */
  locale: string;
  /** Objectif de conversion deviné. */
  primaryConversion: string | null;
  /** Ce que la phrase ne dit pas et qu'il faudra chercher. */
  unknowns: string[];
}

/** Un fait vérifié, avec sa source. Aucun fait sans provenance. */
export interface VerifiedFact {
  key: string;
  value: string;
  /** URL ou origine ; « user » si fourni par l'utilisateur. */
  source: string;
  /** Confiance : `verified` = observé sur une source ; `claimed` = affirmé sans preuve. */
  confidence: "verified" | "claimed";
}

/** Registre de faits + éléments explicitement NON trouvés. */
export interface FactRegistry {
  facts: VerifiedFact[];
  /** Champs cherchés mais introuvables : deviennent [À CONFIRMER], jamais inventés. */
  notFound: string[];
}

/** Décisions de direction artistique (prises par ACE, pas par l'utilisateur). */
export interface ArtDirection {
  concept: string;
  preset: string;
  motionIntensity: "none" | "subtle" | "cinematic";
  webglIntensity: "none" | "accent" | "immersive";
  density: "compact" | "comfortable" | "spacious";
  recipes: {
    hero: string;
    navigation: string;
    projects: string;
    storytelling: string;
    conversion: string;
    layout: string;
  };
  rationale: string;
  /** true si un agent (Claude) a affiné/validé ces choix. */
  agentSupplied: boolean;
}

/** Trace d'une étape exécutée. */
export interface MissionStep {
  state: AutopilotState;
  startedAt: string;
  endedAt: string | null;
  ok: boolean;
  /** Commandes réellement exécutées à cette étape. */
  commands: string[];
  notes: string[];
}

/** Résultat d'une boucle d'itération visuelle. */
export interface QualityIteration {
  round: number;
  /** Score global 0..1 (null si non évalué — jamais supposé bon). */
  score: number | null;
  screenshots: string[];
  issues: string[];
  fixed: string[];
}

/** La mission persistée. C'est ce qui permet la reprise après interruption. */
export interface AutopilotMission {
  /** Identifiant stable (slug + horodatage). */
  id: string;
  /** Version du format d'état (migration future). */
  schemaVersion: 1;
  /** Phrase d'origine de l'utilisateur, telle quelle. */
  brief: string;
  intent: AutopilotIntent;
  slug: string;
  /** Dossier du site généré. */
  targetDir: string | null;
  /**
   * Assets fournis par le client (photos, vidéos, logo). Leur présence rend la
   * génération IA inutile : on n'invente pas ce qui existe déjà.
   */
  providedAssets: string[];
  /** Dossier source de ces assets, transmis au générateur. */
  assetsDir: string | null;
  state: AutopilotState;
  blockedReason: BlockedReason | null;
  /** Message court, compréhensible sans compétence technique. */
  blockedMessage: string | null;
  facts: FactRegistry;
  artDirection: ArtDirection | null;
  /** Chemin du manifeste média, s'il y en a un. */
  mediaManifestPath: string | null;
  /**
   * Contenu éditorial rédigé à partir des FAITS VÉRIFIÉS uniquement.
   * `null` tant que l'agent ne l'a pas fourni : sans lui, le site resterait un
   * squelette de placeholders — ce qui n'est pas un site premium.
   */
  content: SiteContentDraft | null;
  iterations: QualityIteration[];
  steps: MissionStep[];
  /** Dépense cumulée connue (devise du provider). */
  spend: { amount: number; currency: string; isLowerBound: boolean };
  /** URL de preview locale une fois disponible. */
  previewUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Contenu éditorial minimal attendu de l'agent. Chaque champ doit être dérivé
 * d'un fait vérifié ; tout ce qui n'est pas connu reste explicitement
 * « [À CONFIRMER] » plutôt que d'être inventé.
 */
export interface SiteContentDraft {
  hero: { eyebrow: string; title: string; subtitle: string };
  story: {
    heading: string;
    intro: string;
    chapters: { eyebrow: string; title: string; body: string }[];
  };
  collection: {
    heading: string;
    intro: string;
    itemLabel: string;
    items: { title: string; meta: string[] }[];
  };
  conversion: { title: string; description: string };
}

/** Ce que la machine attend de l'agent pour pouvoir avancer. */
export interface AgentRequest {
  /** L'état qui a besoin d'une contribution. */
  state: AutopilotState;
  /** Ce que l'agent doit produire, en clair. */
  needs: string[];
  /** Où déposer le résultat (fichier JSON). */
  writeTo: string;
}

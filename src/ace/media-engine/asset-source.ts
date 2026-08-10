/**
 * ACE — ASSET SOURCE POLICY (source unique de vérité des médias).
 *
 * Doctrine : **ACE ne génère JAMAIS d'image ni de vidéo via un service payant.**
 * Le coût média d'un site produit par ACE est de 0 €. Les visuels viennent
 * toujours du réel : ce que le client fournit, ce que l'entreprise publie
 * officiellement, ou ce que l'utilisateur apporte depuis un outil externe.
 *
 * Hiérarchie OBLIGATOIRE (on descend seulement si le niveau au-dessus est vide) :
 *
 *   A. CLIENT_PROVIDED               médias remis directement
 *   B. OFFICIAL_WEBSITE              site officiel de l'entreprise
 *   C. OFFICIAL_SOCIAL               comptes officiels, provenance vérifiable
 *   D. OTHER_VERIFIED_OFFICIAL       autre source clairement rattachée
 *   E. USER_SUPPLIED_GENERATED       image/vidéo créée AILLEURS puis fournie
 *   F. EDITORIAL_FALLBACK            aucun média adéquat : parti-pris éditorial
 *
 * Chaque asset porte sa provenance. Un média CONCEPTUEL n'est jamais présenté
 * comme une réalisation réelle de l'entreprise.
 */

/** Origine d'un média, du plus fiable au dernier recours. */
export const ASSET_SOURCE_KINDS = [
  "CLIENT_PROVIDED",
  "OFFICIAL_WEBSITE",
  "OFFICIAL_SOCIAL",
  "OTHER_VERIFIED_OFFICIAL",
  "USER_SUPPLIED_GENERATED",
  "EDITORIAL_FALLBACK",
] as const;

export type AssetSourceKind = (typeof ASSET_SOURCE_KINDS)[number];

/** Priorité (1 = meilleur). Sert au tri et au choix du média principal. */
export function sourcePriority(kind: AssetSourceKind): number {
  return ASSET_SOURCE_KINDS.indexOf(kind) + 1;
}

/** Ce que le média MONTRE réellement. Distinction non négociable. */
export type AssetNature =
  /** Une photo/vidéo réelle de l'entreprise, de ses lieux, produits, équipe. */
  | "REAL"
  /** Une image d'illustration ou d'ambiance : ne prouve aucune réalisation. */
  | "CONCEPTUAL";

/** Rôle attendu dans la page. */
export type AssetRole =
  | "logo"
  | "hero"
  | "gallery"
  | "project"
  | "product"
  | "team"
  | "venue"
  | "texture"
  | "video"
  | "other";

/** Statut de droit d'utilisation — jamais supposé. */
export type AssetRights =
  /** Droits confirmés par le client / licence explicite. */
  | "CONFIRMED"
  /** Média officiel public, utilisable en démo privée, à confirmer avant prod. */
  | "OFFICIAL_PUBLIC_UNCONFIRMED"
  /** Origine incertaine : interdit en production. */
  | "UNKNOWN";

/** Contexte d'utilisation du site. */
export type UsageContext =
  /** Maquette de prospection privée : noindex, aucune publication. */
  | "PRIVATE_DEMO"
  /** Site réellement publié : les droits doivent être confirmés. */
  | "PRODUCTION";

/** Un média, avec toute sa provenance. Aucun champ deviné. */
export interface AssetRecord {
  /** Chemin local une fois importé (sous `public/assets/client/`). */
  path: string;
  source: AssetSourceKind;
  /** URL ou description exacte de l'origine. Obligatoire hors fallback. */
  sourceRef: string;
  nature: AssetNature;
  role: AssetRole;
  /** Type MIME simplifié. */
  kind: "image" | "video";
  width?: number;
  height?: number;
  bytes?: number;
  /** ISO 8601 : quand l'asset a été récupéré (traçabilité). */
  retrievedAt?: string | null;
  /** Texte alternatif — descriptif, jamais un slogan. */
  alt: string;
  rights: AssetRights;
  /** Notes libres (mention de crédit, restriction connue…). */
  notes?: string;
}

export interface AssetInventory {
  usage: UsageContext;
  assets: AssetRecord[];
  /** Ce qui a été cherché mais reste introuvable (jamais inventé). */
  missing: string[];
}

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

export interface AssetIssue {
  path: string;
  severity: "error" | "warning";
  message: string;
}

/**
 * Contrôle un inventaire. Les erreurs BLOQUENT l'usage de l'asset ; les
 * avertissements sont remontés à l'utilisateur avant publication.
 */
export function validateInventory(inventory: AssetInventory): AssetIssue[] {
  const issues: AssetIssue[] = [];
  for (const a of inventory.assets) {
    // Provenance obligatoire : c'est ce qui garantit « rien d'inventé ».
    if (a.source !== "EDITORIAL_FALLBACK" && !a.sourceRef.trim()) {
      issues.push({ path: a.path, severity: "error", message: "provenance manquante" });
    }
    if (!a.alt.trim()) {
      issues.push({ path: a.path, severity: "warning", message: "texte alternatif manquant" });
    }
    // En production, un droit non confirmé est bloquant.
    if (inventory.usage === "PRODUCTION" && a.rights !== "CONFIRMED") {
      issues.push({
        path: a.path,
        severity: "error",
        message:
          a.rights === "OFFICIAL_PUBLIC_UNCONFIRMED"
            ? "média officiel public : droits à confirmer avec le client avant publication"
            : "origine des droits inconnue : interdit en production",
      });
    }
    // Un média conceptuel ne doit jamais illustrer une réalisation.
    if (a.nature === "CONCEPTUAL" && (a.role === "project" || a.role === "product")) {
      issues.push({
        path: a.path,
        severity: "error",
        message: "média conceptuel utilisé comme réalisation/produit réel : présentation trompeuse",
      });
    }
  }
  return issues;
}

/** Assets réellement utilisables dans ce contexte (les erreurs sont écartées). */
export function usableAssets(inventory: AssetInventory): AssetRecord[] {
  const blocked = new Set(
    validateInventory(inventory)
      .filter((i) => i.severity === "error")
      .map((i) => i.path),
  );
  return inventory.assets
    .filter((a) => !blocked.has(a.path))
    .sort((x, y) => sourcePriority(x.source) - sourcePriority(y.source));
}

/** Le meilleur média pour un rôle donné (hiérarchie de sources respectée). */
export function bestAssetFor(inventory: AssetInventory, role: AssetRole): AssetRecord | null {
  return usableAssets(inventory).find((a) => a.role === role) ?? null;
}

/**
 * Reste-t-il de quoi construire une expérience portée par l'image ?
 * Un logo seul ne suffit pas : il faut de la matière (photo/vidéo).
 */
export function hasVisualMaterial(inventory: AssetInventory): boolean {
  return usableAssets(inventory).some((a) => a.role !== "logo" && a.role !== "texture");
}

/** Mention à afficher pour une démo privée exploitant des médias officiels. */
export function provenanceDisclosure(inventory: AssetInventory): string | null {
  if (inventory.usage !== "PRIVATE_DEMO") return null;
  const official = usableAssets(inventory).filter(
    (a) => a.source === "OFFICIAL_WEBSITE" || a.source === "OFFICIAL_SOCIAL",
  );
  if (official.length === 0) return null;
  return (
    "Maquette de présentation non sollicitée. Les visuels proviennent des supports " +
    "publics officiels de l'entreprise et restent sa propriété ; aucune revendication " +
    "de droits n'est faite."
  );
}

/**
 * Ce qu'il faudrait obtenir pour passer en production, en clair.
 * Vide = tout est confirmé.
 */
export function productionBlockers(inventory: AssetInventory): string[] {
  return validateInventory({ ...inventory, usage: "PRODUCTION" })
    .filter((i) => i.severity === "error")
    .map((i) => `${i.path} — ${i.message}`);
}

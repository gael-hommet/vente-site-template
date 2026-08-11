import type { AssetInventory, AssetRecord } from "../media-engine/asset-source";
import { chooseSpatialMode, type SpatialDecision } from "../spatial-cinema/strategy";

/**
 * ACE AUTOPILOT — choix de la stratégie spatiale.
 *
 * L'utilisateur écrit « Transforme ces quatre images en visite immersive. »
 * Il ne connaît ni les depth maps, ni les modes, ni le WebGL. C'est ACE qui
 * REGARDE ce qui existe réellement et en déduit la stratégie.
 *
 * Rien n'est supposé : on ne compte que des fichiers réellement présents dans
 * l'inventaire, avec leur nature et leurs droits. Si la matière manque, la
 * décision le dit — elle n'invente pas une expérience impossible.
 */

/** Reconnaît un fichier de PROFONDEUR : il accompagne une image, il n'en est pas une. */
export function isDepthMapPath(p: string): boolean {
  return /(\.depth|-depth)\.png$/i.test(p);
}

/** Une carte de profondeur accompagne l'image `foo.jpg` sous `foo.depth.png`. */
export function depthMapFor(asset: AssetRecord, inventory: AssetInventory): string | null {
  const base = asset.path.replace(/\.[^./]+$/, "");
  const found = inventory.assets.find(
    (a) => a.path === `${base}.depth.png` || a.path === `${base}-depth.png`,
  );
  return found ? found.path : null;
}

/** Un modèle 3D réel a été fourni (glTF/GLB) — la vraie 3D prime sur tout. */
export function hasRealModel(inventory: AssetInventory): boolean {
  return inventory.assets.some((a) => /\.(glb|gltf)$/i.test(a.path));
}

/**
 * Images exploitables pour une scène spatiale : de vraies photos du lieu, dont
 * l'origine est connue. Une image CONCEPTUELLE ne montre pas l'endroit — elle
 * n'a rien à faire dans une « visite ». Une image d'origine inconnue non plus.
 *
 * En production, seules les images aux droits CONFIRMÉS sont retenues ; en
 * maquette privée, un média officiel public est accepté (à confirmer avant
 * publication) — c'est exactement la règle de l'Asset Source Policy.
 */
export function spatialCandidates(inventory: AssetInventory): AssetRecord[] {
  const productionReady = inventory.usage === "PRODUCTION";
  return inventory.assets.filter(
    (a) =>
      a.kind === "image" &&
      // Une carte de profondeur n'est pas une scène : elle habille une image.
      !isDepthMapPath(a.path) &&
      a.nature === "REAL" &&
      a.role !== "logo" &&
      (productionReady ? a.rights === "CONFIRMED" : a.rights !== "UNKNOWN"),
  );
}

export interface AutopilotSpatialDecision extends SpatialDecision {
  /** Images retenues pour construire le voyage. */
  images: string[];
  /** Cartes de profondeur trouvées, alignées sur `images`. */
  depthMaps: (string | null)[];
  /** Ce qu'il manque, en langage clair, pour que l'expérience soit possible. */
  missing: string[];
}

/**
 * Décide de la stratégie spatiale à partir du seul inventaire média.
 *
 * `overlappingViews` est DÉCLARATIF : ACE 0.3 ne mesure pas le recouvrement
 * entre vues. On ne le devine pas — on ne le prétend pas non plus.
 */
export function decideSpatialStrategy(
  inventory: AssetInventory,
  options: { overlappingViews?: boolean } = {},
): AutopilotSpatialDecision {
  const candidates = spatialCandidates(inventory);
  const depthMaps = candidates.map((a) => depthMapFor(a, inventory));
  const withDepth = depthMaps.filter(Boolean).length;

  const decision = chooseSpatialMode({
    imageCount: candidates.length,
    depthMapCount: withDepth,
    hasRealModel3d: hasRealModel(inventory),
    overlappingViews: options.overlappingViews ?? false,
  });

  const missing: string[] = [];
  if (candidates.length === 0) {
    missing.push(
      "aucune photo réelle exploitable : une visite spatiale ne peut pas être fabriquée à partir de rien",
    );
  } else if (withDepth === 0) {
    missing.push(
      `carte de profondeur absente pour ${String(candidates.length)} image(s) : ` +
        "ACE ne l'invente pas. Sans elle, la page reste éditoriale plutôt que fausse.",
    );
  } else if (withDepth < candidates.length) {
    missing.push(
      `${String(candidates.length - withDepth)} image(s) sans carte de profondeur : ` +
        "elles seront écartées du voyage, pas aplaties en diaporama.",
    );
  }

  return {
    ...decision,
    images: candidates.map((a) => a.path),
    depthMaps,
    missing,
  };
}

/**
 * Phrase destinée à l'utilisateur — sans jargon, sans promesse fausse.
 */
export function explainSpatialDecision(decision: AutopilotSpatialDecision): string {
  switch (decision.mode) {
    case "real-3d":
      return "Un vrai modèle 3D a été fourni : la scène sera navigable en 3D réelle.";
    case "hybrid-spatial":
      return `${String(decision.images.length)} photos deviennent ${String(decision.images.length)} espaces traversés par une caméra, enchaînés sans coupure.`;
    case "depth-scene":
      return "La photo devient un espace : la caméra s'y déplace, le relief se creuse.";
    default:
      return "La matière disponible ne permet pas une expérience spatiale honnête ; la page restera éditoriale.";
  }
}

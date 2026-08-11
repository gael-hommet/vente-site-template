import type { SpatialManifest, SpatialScene } from "./types";

/**
 * ACE SPATIAL CINEMA — implantation des scènes dans l'espace.
 *
 * Deux problèmes concrets sont réglés ici, tous deux visibles à l'écran :
 *
 * 1. **Le raccord ne doit pas montrer la scène suivante « au loin ».** Si les
 *    scènes sont espacées d'une constante arbitraire, la caméra arrive sur la
 *    suivante beaucoup trop loin : on voit une petite image flotter au milieu
 *    de la précédente. C'est exactement le diaporama qu'on refuse.
 *    → Les origines sont ENCHAÎNÉES : la position de fin de la scène N est la
 *      position de départ de la scène N+1. La caméra ne saute jamais, et la
 *      scène suivante est à sa distance de cadrage prévue quand on l'atteint.
 *
 * 2. **Le plan doit couvrir tout l'écran.** Un plan de taille fixe laisse
 *    apparaître ses bords (fond vide) dès que la focale s'ouvre ou que l'écran
 *    est large. → La taille est calculée depuis le tronc de vision réel.
 */

/**
 * Origines Z des scènes, enchaînées pour que la caméra soit continue.
 *
 * `origine[n+1] = origine[n] + fin_de_trajet[n] − début_de_trajet[n+1]`
 */
export function sceneOrigins(manifest: SpatialManifest): number[] {
  const origins: number[] = [];
  manifest.scenes.forEach((scene: SpatialScene, i) => {
    if (i === 0) {
      origins.push(0);
      return;
    }
    const prev = manifest.scenes[i - 1] as SpatialScene;
    const prevOrigin = origins[i - 1] as number;
    // Position de la caméra à la fin de la scène précédente, en coordonnées monde.
    const cameraHandover = prevOrigin + prev.camera.positionTo.z;
    origins.push(cameraHandover - scene.camera.positionFrom.z);
  });
  return origins;
}

/**
 * Taille du plan pour qu'il couvre le cadre, marge comprise.
 * `distance` est la distance caméra→plan la plus GRANDE du trajet : c'est là
 * que le plan occupe le moins de place à l'écran.
 */
export function coverScale(
  distance: number,
  fov: number,
  aspect: number,
  margin = 1.4,
): [number, number] {
  const height = 2 * Math.abs(distance) * Math.tan((fov * Math.PI) / 360) * margin;
  const width = height * Math.max(aspect, 0.1);
  return [width, height];
}

/**
 * Distance et focale les plus défavorables d'une scène : c'est ce couple qui
 * dimensionne le plan. On tient compte du raccord sortant, pendant lequel la
 * caméra s'éloigne encore un peu de la scène suivante.
 */
export function worstCaseFraming(scene: SpatialScene): { distance: number; fov: number } {
  const distance = Math.max(
    Math.abs(scene.camera.positionFrom.z),
    Math.abs(scene.camera.positionTo.z),
  );
  const fov = Math.max(scene.camera.fovFrom, scene.camera.fovTo);
  return { distance, fov };
}

/** Taille de plan d'une scène, pour un rapport d'écran donné. */
export function sceneScale(scene: SpatialScene, aspect: number): [number, number] {
  const { distance, fov } = worstCaseFraming(scene);
  return coverScale(distance, fov, aspect);
}

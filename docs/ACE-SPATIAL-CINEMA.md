# ACE Spatial Cinema Engine

Transforme des **images réelles** en un **espace traversé par une caméra**,
piloté par le scroll. Ce n'est pas un diaporama, pas un carrousel, pas un fondu :
le spectateur doit sentir qu'il **avance dans un lieu**.

Coût média externe : **0 €**. Aucun provider, aucun service payant, aucun modèle
téléchargé.

---

## 1. Ce que le moteur fait réellement

| Mode                  | Matière nécessaire                           | État en 0.3                              |
| --------------------- | -------------------------------------------- | ---------------------------------------- |
| `depth-scene`         | 1 photo **+ sa carte de profondeur**         | **fonctionnel**                          |
| `hybrid-spatial`      | plusieurs photos, chacune avec sa profondeur | **fonctionnel**                          |
| `real-3d`             | un `.glb` / `.gltf`                          | délégué aux scènes R3F existantes        |
| `multiview-candidate` | 20–100 vues qui se recouvrent                | **non réalisé** — signalé, jamais simulé |

La profondeur n'est **pas** un effet CSS : chaque image habille un **maillage
très subdivisé** dont les sommets sont **déplacés en Z** dans le vertex shader.
Quand la caméra bouge, le premier plan et le fond ne se déplacent pas à la même
vitesse — c'est du parallaxe géométrique, pas une illusion 2D.

## 2. Architecture

```
src/ace/spatial-cinema/
  types.ts            contrats (manifeste, scène, trajet, transition, ancres)
  timeline.ts         progression → scène → progression locale → raccord   [pur]
  camera-path.ts      primitives de mouvement + interpolation réversible   [pur]
  layout.ts           implantation des scènes + dimensionnement des plans  [pur]
  strategy.ts         quelle stratégie la matière disponible justifie      [pur]
  spatial-quality.ts  gate anti-diaporama                                  [pur]
  DepthMesh.tsx       maillage + déplacement par profondeur (WebGL)
  SpatialCinema.tsx   runtime : rig caméra, raccords, chapitres, replis
  fixture.ts          démonstration interne (jamais livrée à un client)
```

Le **cœur est pur** (aucun DOM, aucun WebGL) : c'est ce qui rend la promesse
« ce n'est pas un diaporama » **démontrable par des tests unitaires**, et pas
seulement affirmée.

Réutilise l'existant plutôt que de le dupliquer : `WebGLBoundary`,
`ThreeCanvas`, `useScrubProgress` (GSAP/ScrollTrigger), `useQuality`,
`useReducedMotion`.

## 3. Le manifeste

```ts
const manifest: SpatialManifest = {
  mode: "hybrid-spatial",
  poster: "/media/salle.jpg", // repli sans WebGL / reduced-motion
  alt: "Visite de la salle principale",
  length: 8, // écrans de scroll
  scenes: [
    {
      id: "approche",
      image: "/media/salle.jpg",
      depthMap: "/media/salle.depth.png",
      start: 0,
      end: 0.28,
      camera: cameraPathFor("dolly-in", vec3(0, 0, 2.8)),
      depth: { strength: 1.15, near: 1, far: 0 },
      transitionOut: { type: "OCCLUSION", duration: 0.05 },
      alt: "Approche de l'entrée",
    },
    // …
  ],
  chapters: [{ at: 0, eyebrow: "01", title: "L'approche" }],
};
```

Rien n'y est spécifique à un client : le manifeste est une **donnée**.

## 4. Le scroll pilote une caméra, jamais une opacité

`resolveTimeline(manifest, progress)` est un **mapping pur** : même progression
⇒ même état, donc **remonter le scroll repasse exactement par le même chemin**.
Aucune intégration du temps, aucune vitesse accumulée, **aucun autoplay**.

Le scroll pilote : position X/Y/Z · cible · focale · progression locale ·
avancement du raccord. Jamais un fondu.

## 5. Les raccords sont spatiaux

Types : `OCCLUSION` · `PUSH_THROUGH` · `DARK_FRAME` · `GLASS_PASS` ·
`EDGE_WIPE_SPATIAL` · `DEPTH_WARP`.

Deux mécanismes garantissent qu'un raccord n'est **pas** un fondu :

1. **Les origines des scènes sont enchaînées** (`layout.ts`) : la caméra termine
   une scène exactement là où commence la suivante. Elle ne saute pas, et la
   scène d'arrivée est déjà **à sa distance de cadrage** — jamais une petite
   image lointaine flottant au milieu de la précédente.
2. **La bascule est confinée au pic d'occlusion** (`SWAP_START` → `SWAP_END`,
   12 % du raccord). Partout où les deux scènes coexistent, l'écran est masqué à
   plus de 70 %. Le changement se produit **derrière l'obstacle**.

## 6. Cadrage : aucun bord vide

Un plan de taille fixe laisse voir ses bords dès que la focale s'ouvre ou que
l'écran change de format. `sceneScale()` calcule la taille du plan à partir du
**tronc de vision réel** (distance la plus défavorable, focale la plus large,
rapport d'écran courant, marge 1,4). Valable du portrait mobile au 21:9.

## 7. Performance et appareils

- Subdivision par tier : ULTRA 224 · BALANCED 144 · LITE 80.
- **LITE ne coupe pas la 3D** : il l'allège. Le repli éditorial n'intervient
  qu'au dernier cran de charge (`STRAIN_FALLBACK`), sur un appareil réellement
  incapable de suivre.
- Une seule scène suivante est préchargée — jamais les quatre d'un coup.
- Seules les scènes actives sont montées ; chacune a sa frontière de suspense,
  pour qu'une scène qui charge ne vide jamais le cadre.

## 8. Accessibilité

Sous `prefers-reduced-motion` : **aucun mouvement spatial**, image stable,
chapitres lisibles, CTA atteignable, **scroll libre** (pas d'épinglage, la page
retrouve sa hauteur normale). Sans WebGL : `WebGLBoundary` affiche le poster.
Le contenu ne dépend jamais du Canvas.

## 9. Outils

```bash
pnpm ace:spatial:doctor    # l'environnement peut-il produire du spatial honnête ?
pnpm ace:spatial:plan      # que fera le voyage ? (sans lancer le site)
pnpm ace:spatial:verify    # gate anti-diaporama
```

Banc d'essai interne : `/ace-lab/spatial` · `?spatialDebug=1` affiche scène,
progression, raccord et position caméra. Jamais actif en production.

## 10. Limites assumées

Une scène en profondeur est une **illusion spatiale très convaincante**, pas une
reconstruction. Elle ne permet **pas** :

- de regarder derrière un objet ;
- de pivoter à 90° dans une seule photo ;
- d'inventer une pièce hors champ.

Les amplitudes de caméra sont donc **volontairement contenues** : au-delà, le
maillage se troue et l'illusion casse. ACE préfère une page éditoriale honnête à
un faux voyage.

Voir `ACE-SPATIAL-CAPTURE-GUIDE.md` (quoi photographier) et `ACE-SPATIAL-QA.md`
(comment contrôler).

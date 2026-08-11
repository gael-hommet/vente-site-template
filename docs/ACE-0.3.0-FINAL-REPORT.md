# ACE 0.3.0 — Spatial Cinema Engine · rapport final

## 1. Version avant

`0.2.2` — Free Media Autopilot (coût média 0 €).

## 2. Version après

`0.3.0` — Spatial Cinema Engine. `src/ace/core/version.ts` et `package.json`.

## 3. Architecture ajoutée

```
src/ace/spatial-cinema/
  types.ts            contrats (manifeste, scène, trajet, transition, ancres)
  timeline.ts         progression → scène → progression locale → raccord   [pur]
  camera-path.ts      10 primitives de mouvement + interpolation           [pur]
  layout.ts           implantation enchaînée + dimensionnement des plans   [pur]
  strategy.ts         quelle stratégie la matière justifie                 [pur]
  spatial-quality.ts  gate anti-diaporama                                  [pur]
  DepthMesh.tsx       maillage subdivisé + déplacement en Z (WebGL)
  SpatialCinema.tsx   runtime : rig caméra, raccords, chapitres, replis
  fixture.ts          démonstration interne (jamais livrée)
src/ace/autopilot/spatial-decision.ts   choix du mode depuis l'inventaire réel
scripts/ace/spatial/{doctor.mjs,plan.ts,verify.ts}
src/app/ace-lab/spatial/ + src/components/ace-lab/SpatialCinemaLab.tsx
```

Le cœur est **pur** (aucun DOM, aucun WebGL) : la promesse « ce n'est pas un
diaporama » est **démontrable par des tests**, pas seulement affirmée.
Réutilise l'existant : `WebGLBoundary`, `ThreeCanvas`, `useScrubProgress`
(GSAP/ScrollTrigger), `useQuality`, `useReducedMotion`. Rien n'a été dupliqué.

## 4. DEPTH_SCENE réel ?

**Oui.** L'image habille un plan très subdivisé (224/144/80 segments selon le
tier) dont chaque sommet est déplacé en Z dans le vertex shader :

```glsl
float d = texture2D(uDepth, uv).r;
float mapped = mix(uFar, uNear, clamp(d, 0.0, 1.0));
vec3 displaced = position + normal * mapped * uStrength;
```

Ce n'est ni un effet CSS ni un parallaxe 2D : la géométrie change réellement.

## 5. HYBRID_SPATIAL_CINEMA réel ?

**Oui.** 4 scènes en profondeur réelle, enchaînées par 3 raccords spatiaux en une
seule timeline. Mesuré au navigateur, la caméra descend **en continu**
z = +2.80 → +2.15 → +1.90 → +1.45 → +0.30 → +0.68 : un seul voyage, sans saut.

## 6. Portal Transitions

`OCCLUSION` · `PUSH_THROUGH` · `DARK_FRAME` · `GLASS_PASS` ·
`EDGE_WIPE_SPATIAL` · `DEPTH_WARP`.

Deux mécanismes interdisent le fondu :

1. **Origines enchaînées** — la caméra finit une scène là où commence la
   suivante, donc la scène d'arrivée est déjà à sa distance de cadrage.
2. **Bascule confinée au pic d'occlusion** (12 % du raccord) : partout où les
   deux scènes coexistent, l'écran est masqué à **plus de 70 %**.

## 7. Caméra

Le scroll pilote position X/Y/Z, cible, focale, progression locale et
avancement du raccord — **jamais une opacité**. `resolveTimeline` est un mapping
pur : remonter le scroll repasse **exactement** par le même chemin (écart mesuré
< 1e-9). Aucun autoplay, aucune intégration du temps dans `useFrame`.
Parallaxe de pointeur volontairement minuscule (±0,06 / ±0,04).

## 8. Cartes de profondeur

**ACE n'en génère aucune et n'en télécharge aucune.** Aucun modèle, aucun poids,
aucun service. Une carte fournie est consommée ; absente, la scène est refusée
(`DEPTH_MAP_REQUIRED`) et la page reste éditoriale. `ace:spatial:doctor` le dit
explicitement plutôt que de laisser croire à une estimation automatique.

Les fixtures de test sont fabriquées **localement** avec ffmpeg (`geq`), coût 0 €,
et vérifiées numériquement non plates avant usage.

## 9. Preuve anti-diaporama

**Unitaire** (`tests/unit/spatial-cinema.test.ts`, 30 tests) — échoue si
l'implémentation dégénère en `image = round(progress * n)` ou en fondu :
position caméra continue sans palier ni saut · réversibilité < 1e-9 · **source du
shader** contenant l'échantillonnage de profondeur et le déplacement des sommets
sur géométrie subdivisée · caméra sans saut entre scènes · plan couvrant le cadre
de 0,46 à 2,4 de rapport · masquage > 70 % partout où deux scènes coexistent ·
un manifeste « diaporama » est **REJETÉ** (`NO_CAMERA_MOVEMENT` + `FLAT_TEXTURE`

- `HARD_CUT`).

**Navigateur réel** — 45 positions balayées, 8 points capturés desktop + mobile.
À chaque point : `canvas = 1`, `img = 0` (aucune image ne remplace le rendu),
position caméra et focale relevées depuis la boucle de rendu.

## 10. Mobile

**Reste immersif.** Le tier `LITE` **n'éteint plus la 3D** : il l'allège
(maillage 80, DPR 1). Capturé en iPhone 13 : `canvas = 1`, `img = 0`, même voyage,
mêmes raccords, plan couvrant tout le portrait (rapport 0,46).

## 11. Reduced motion

Mesuré (`prefers-reduced-motion: reduce`) : `canvas = 0`, poster affiché,
hauteur de page **1212 px au lieu de 8 × la fenêtre** — aucun scroll confisqué.
Chapitres lisibles, CTA présent, contenu suivant atteignable, zéro erreur.

## 12. Performance

Subdivision par tier · DPR plafonné dès la première alerte · dégradation
progressive en 3 crans avant tout repli · **une seule** scène suivante
préchargée · seules les scènes actives sont montées · frontière de suspense par
scène. Aucune erreur console sur l'ensemble des balayages desktop et mobile.

_Non mesuré :_ FPS chiffré et profil mémoire sur GPU réel — l'environnement de
vérification est un rendu **logiciel** (SwiftShader), non représentatif.

## 13. Générateur

`public/ace-lab`, `fixture.ts`, le test moteur et les trois docs spatiales sont
élagués. Le **runtime** n'est conservé que si le site s'en sert réellement
(inspection du code livré) ; sinon `src/ace/spatial-cinema` est retiré et les
commandes `ace:spatial:*` disparaissent de `package.json`. Test de non-régression
dans `tests/unit/ace-generator-cli.test.ts`, exécuté contre le contenu commité.

## 14. Autopilot

`decideSpatialStrategy()` lit l'inventaire média réel et choisit seul :
GLB → `real-3d` · plusieurs photos avec profondeur → `hybrid-spatial` · une photo
→ `depth-scene` · rien d'exploitable → page éditoriale, aucune promesse.
Écarte logos, visuels `CONCEPTUAL` et, en production, les droits non confirmés.
`explainSpatialDecision()` répond en langage clair. **Aucun questionnaire
technique** n'est posé à l'utilisateur.

## 15. Tests

`pnpm check` **vert** : lint + typecheck + **293 tests** + build.
38 tests dédiés (30 moteur spatial + 8 Autopilot spatial).

## 16. Captures examinées

Oui — réellement regardées, pas seulement produites. Ce qu'elles ont montré :

- **progression 0 et 0,165** (même scène) : le cadrage change géométriquement,
  les barres sont **bombées en perspective** → la caméra avance dans la
  géométrie, ce n'est pas un fondu.
- **progression 0,514** (`PUSH_THROUGH`) : cadre **entièrement couvert**, une
  seule scène lisible, aucun bord vide.
- **progression 0,645** : relief franc, silhouette du maillage visible sur la
  crête de profondeur.
- **mobile 0,614** : portrait couvert, chapitre et CTA lisibles.

## 17. Limites assumées

- `multiview-candidate` est **annoncé, pas réalisé**. Aucune reconstruction
  multi-vues dans la 0.3.
- **Aucune estimation de profondeur embarquée.** Sans carte fournie, pas de
  scène spatiale — jamais de relief simulé.
- Une scène en profondeur est une **illusion**, pas une reconstruction : elle ne
  permet ni de regarder derrière un objet, ni de pivoter à 90°, ni d'inventer un
  hors-champ. Les amplitudes de caméra sont donc contenues (`MAX_SAFE_TRAVEL`).
- Le raccord `GLASS_PASS` est le moins masquant du lot (75 %) : à réserver aux
  scènes dont les bords se ressemblent.
- Les fixtures sont des **mires**, pas des photos : elles prouvent la géométrie,
  pas le rendu photographique final.
- FPS et mémoire non chiffrés sur GPU réel (voir §12).

## 18. Commits

- `a6426cc` — moteur Spatial Cinema (runtime, cœur pur, CLI, élagage, 30 tests)
- `b5dc372` — Autopilot spatial, docs, version 0.3.0

## 19. État git

Branche `feat/ace-0.3-spatial-cinema`, arbre propre, **aucun push, aucun
déploiement**. SCMC n'a pas été touché.

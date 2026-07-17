# WEBGL-AUDIT — 3D / React Three Fiber

> Audit ACE · 2026-07-17

## 1. Chaîne de rendu — conforme aux règles

- **Jamais de WebGL en SSR** : `WebGLBoundary` rend le fallback pendant SSR et jusqu'au montage (détection hydration-safe via `useSyncExternalStore`, sans setState-in-effect). Les scènes lourdes passent par `next/dynamic({ ssr: false })`.
- **Fallback obligatoire** : `AdaptiveCanvas` exige la prop `fallback` (type `WebGLFallbackProps`) — impossible de monter une scène sans alternative image/vidéo avec `alt`. Error boundary interne : une scène qui crash bascule sur le fallback au lieu d'un écran blanc.
- **Tiers ULTRA / BALANCED / LITE** (`lib/performance/quality.ts`) : `pickTier` **pur et testé** — LITE forcé si pas de WebGL, reduced-motion, save-data ou ≤2 Go RAM ; BALANCED si pointeur grossier, ≤4 Go ou ≤4 cœurs. En **LITE, WebGL ne boote pas du tout** (fallback direct).
- **Budgets par tier** (`QUALITY_BUDGETS`) : DPR clampé ([1,2] / [1,1.5] / [1,1]), antialias, ombres et postprocessing coupés hors ULTRA, maxTextureSize 2048/1024/512, targetFps 60/60/30.
- `PerformanceController` ajuste sous contrainte ; `DeviceQualityProvider` + `useQuality` exposent le profil ; store zustand (`performance/store`, `three/scene-store`).

## 2. Scènes de démonstration

`scenes/{vehicle-journey,product-reveal,logo-reveal}` : servent de références
d'implémentation (caméra au scroll via ScrollCamera/CameraRig, stages,
EnvironmentRig, PostFX gated ULTRA). Aucun asset lourd committé (public/models
ne contient que des placeholders légers).

## 3. Écarts pour ACE

| Constat | Recommandation |
| --- | --- |
| `frameloop="demand"` / pause hors-viewport à vérifier scène par scène quand de vraies scènes clients arriveront | En faire un critère de la checklist Scene Library (étape 13) |
| Pas de bibliothèque de scènes paramétrables — 3 démos ad hoc | Étape 13 : scènes nommées avec contrat (props, assets requis, fallback, budget par tier) |
| Compression KTX2/Draco outillée (`assets:models` via gltf-transform) mais non exercée (aucun modèle réel) | Valider le pipeline sur le premier vrai modèle client |

## 4. Verdict

La fondation WebGL est **au-dessus du standard** : boundary systématique,
fallback requis par le typage, tiers réellement câblés. Aucune correction ;
capitaliser dessus pour la Scene Library.

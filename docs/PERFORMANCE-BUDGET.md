# Budget de performance

Objectif : un rendu **premium et cinématique** qui reste **rapide et fluide** sur mobile comme sur desktop. Ce document fixe des budgets cibles concrets et les règles d'ingénierie associées.

> Ces valeurs sont des **cibles raisonnables**. Elles orientent les arbitrages ; l'audit (`/audit-site`, `pnpm audit:site`) vérifie leur respect.

---

## Web Vitals (cibles)

| Métrique                            | Cible    | Limite à ne pas dépasser |
| ----------------------------------- | -------- | ------------------------ |
| **LCP** (Largest Contentful Paint)  | ≤ 2,0 s  | 2,5 s                    |
| **CLS** (Cumulative Layout Shift)   | ≤ 0,05   | 0,1                      |
| **INP** (Interaction to Next Paint) | ≤ 150 ms | 200 ms                   |

Mesuré sur mobile mid-range, réseau contraint (4G).

## Poids JavaScript (route initiale)

| Élément                      | Cible    |
| ---------------------------- | -------- |
| JS initial (route `/`, gzip) | ≤ 150 Ko |
| Plafond dur                  | 200 Ko   |

Les scènes 3D, les effets shaders et les intégrations lourdes **ne comptent pas dans ce budget initial** car elles sont chargées en **dynamic import** (voir règles).

---

## Budgets par tier de qualité

Le tier est choisi automatiquement (support WebGL, `prefers-reduced-motion`, `save-data`, `deviceMemory`, type de pointeur, `hardwareConcurrency`) et reste surchargeable via un sélecteur UI.

| Tier         | Cible matériel                                            | DPR max          | Textures           | Post-processing / ombres                  |
| ------------ | --------------------------------------------------------- | ---------------- | ------------------ | ----------------------------------------- |
| **ULTRA**    | Desktop capable                                           | 2.0              | jusqu'à 2048² (2K) | Oui (bloom, DOF…)                         |
| **BALANCED** | Mobile / milieu de gamme                                  | 1.5              | jusqu'à 1024² (1K) | Non (ni ombres)                           |
| **LITE**     | Ancien appareil / reduced-motion / save-data / sans WebGL | — (pas de WebGL) | —                  | Poster / vidéo / séquence d'images légère |

Notes :

- **DPR** plafonné pour éviter de rendre inutilement en 4×.
- En **BALANCED**, on désactive post-processing et ombres, on réduit la densité de particules et la résolution des cibles de rendu.
- En **LITE**, aucun canvas WebGL n'est monté : on sert un **poster**, une **vidéo** ou une **séquence d'images** légère.

---

## Plafonds d'assets

| Type                                                            | Cible                      | Plafond |
| --------------------------------------------------------------- | -------------------------- | ------- |
| Image (héro, après conversion AVIF/WebP)                        | ≤ 200 Ko                   | 400 Ko  |
| Image (contenu courant)                                         | ≤ 100 Ko                   | 200 Ko  |
| Poster vidéo                                                    | ≤ 150 Ko                   | 250 Ko  |
| Vidéo (mp4/webm optimisée)                                      | ≤ 2,5 Mo                   | 5 Mo    |
| Modèle 3D (GLB, après Draco/Meshopt + textures redimensionnées) | ≤ 2 Mo                     | 4 Mo    |
| Texture 3D individuelle                                         | 2K (ULTRA) / 1K (BALANCED) | 2K      |

Les dérivés optimisés sont produits par le pipeline d'assets (`docs/ASSET-PIPELINE.md`).

---

## Règles d'ingénierie

1. **Dynamic import des scènes lourdes** — toute scène 3D / effet shader / intégration ADAPTER ONLY est chargée via `next/dynamic` (ou import dynamique), jamais dans le bundle de la route.
2. **Pas de WebGL en SSR** — les composants canvas sont rendus **client-only** (`ssr: false`) ; le serveur ne monte jamais de contexte WebGL.
3. **Toujours un poster** — chaque scène 3D/vidéo affiche un poster immédiat pendant le chargement (et sert de fallback LITE). Évite le CLS et le canvas noir.
4. **Aucun asset géant commité** — les originaux lourds restent dans `input/assets/` (non servis) ; seuls les dérivés optimisés vont dans `public/`.
5. **Réserver l'espace** — dimensions/`aspect-ratio` fixés sur médias et canvas pour tenir la cible CLS.
6. **Respecter les tiers** — ne pas forcer d'effets ULTRA sur BALANCED/LITE ; honorer `prefers-reduced-motion` et `save-data`.
7. **Lazy + priorité** — `priority` uniquement sur le média LCP ; le reste en lazy-loading.

---

## Vérification

- `pnpm build` — contrôle le poids des bundles.
- `pnpm audit:site` / `/audit-site` — audit perf global.
- `pnpm test:e2e` — vérifie le comportement runtime, y compris les fallbacks.

# Stack technique — Vente Site Engine

Ce document liste l'intégralité des dépendances du template, leur version, et le rôle de chacune. Les dépendances sont regroupées par catégorie : **CORE** (installées et actives), **DEV / TEST**, **ADAPTER-ONLY** (code d'intégration présent mais paquet non installé) et **REJECTED** (volontairement exclu du CORE).

> Gestionnaire de paquets : **pnpm 10.32 uniquement**. Le fichier `pnpm-lock.yaml` est commité et le champ `packageManager` est épinglé. Node 22 (`.nvmrc`), compatible Node 20+. **Ne jamais utiliser `--force` ni `--legacy-peer-deps`.**

---

## CORE — framework & langage

| Paquet       | Version | Rôle                                                                                               |
| ------------ | ------- | -------------------------------------------------------------------------------------------------- |
| `next`       | 16.2.10 | Framework applicatif. App Router + Turbopack. Rendu serveur, routing, métadonnées, sitemap/robots. |
| `react`      | 19.2.4  | Bibliothèque UI. **Épinglé `<19.3`** (voir plus bas).                                              |
| `react-dom`  | 19.2.4  | Rendu DOM de React, aligné sur la même version.                                                    |
| `typescript` | 5       | Typage statique, mode `strict` activé.                                                             |

## CORE — styles & UI

| Paquet                     | Version | Rôle                                                                                                                                  |
| -------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `tailwindcss`              | v4      | Framework CSS. Approche **CSS-first** : les tokens de design sont des variables CSS (custom properties), pas un fichier de config JS. |
| `@tailwindcss/postcss`     | v4      | Plugin PostCSS de Tailwind v4 (pipeline de build des styles).                                                                         |
| `class-variance-authority` | —       | Définition de variantes de composants typées (ex. tailles/tons de boutons).                                                           |
| `clsx`                     | —       | Concaténation conditionnelle de classes.                                                                                              |
| `tailwind-merge`           | —       | Fusion intelligente de classes Tailwind en conflit.                                                                                   |
| `lucide-react`             | —       | Jeu d'icônes SVG React.                                                                                                               |

## CORE — animation & scroll

| Paquet   | Version | Rôle                                                                                                                    |
| -------- | ------- | ----------------------------------------------------------------------------------------------------------------------- |
| `motion` | —       | Successeur de Framer Motion (nom de paquet `motion`). Animations déclaratives de composants React.                      |
| `gsap`   | —       | Moteur d'animation impératif. Utilisé avec **ScrollTrigger** pour les séquences pilotées au scroll (dont la caméra 3D). |
| `lenis`  | —       | Smooth scroll, synchronisé avec GSAP/ScrollTrigger.                                                                     |

## CORE — 3D & WebGL

| Paquet                        | Version | Rôle                                                             |
| ----------------------------- | ------- | ---------------------------------------------------------------- |
| `three`                       | 0.185   | Moteur WebGL de base.                                            |
| `@react-three/fiber`          | 9.6     | Réconciliateur React pour Three.js (R3F).                        |
| `@react-three/drei`           | 10.7    | Helpers R3F (caméras, loaders, contrôles, environnements).       |
| `@react-three/postprocessing` | 3       | Effets de post-traitement (bloom, DOF…) via R3F.                 |
| `postprocessing`              | —       | Bibliothèque d'effets sous-jacente.                              |
| `maath`                       | —       | Utilitaires mathématiques pour la 3D (easing, random, courbes).  |
| `zustand`                     | —       | Store d'état léger (état de scène, tier qualité, sélecteur UI).  |
| `@use-gesture/react`          | —       | Gestion des gestes/pointeur (drag, pinch) pour l'interaction 3D. |

## CORE — formulaires & validation

| Paquet                | Version | Rôle                                                |
| --------------------- | ------- | --------------------------------------------------- |
| `react-hook-form`     | 7       | Gestion des formulaires performante (uncontrolled). |
| `zod`                 | 4       | Schémas de validation typés (client + serveur).     |
| `@hookform/resolvers` | 5       | Pont entre react-hook-form et Zod.                  |

## CORE — cartographie

| Paquet        | Version | Rôle                                                                                  |
| ------------- | ------- | ------------------------------------------------------------------------------------- |
| `maplibre-gl` | 5       | Cartes vectorielles WebGL. **Aucune clé propriétaire requise** (fond de carte libre). |

---

## DEV / TEST

| Paquet                                     | Version | Rôle                                                          |
| ------------------------------------------ | ------- | ------------------------------------------------------------- |
| `eslint` + `eslint-config-next`            | —       | Linting, règles Next.js.                                      |
| `prettier` + `prettier-plugin-tailwindcss` | —       | Formatage, tri automatique des classes Tailwind.              |
| `vitest`                                   | 4       | Runner de tests unitaires.                                    |
| `@testing-library/react`                   | —       | Tests de composants orientés utilisateur.                     |
| `jsdom`                                    | —       | Environnement DOM pour les tests unitaires.                   |
| `@playwright/test`                         | 1.61    | Tests end-to-end (navigateurs réels).                         |
| `@axe-core/playwright`                     | —       | Audits d'accessibilité automatisés dans les E2E.              |
| `sharp`                                    | —       | Traitement d'images (pipeline `assets:images` → AVIF/WebP).   |
| `@gltf-transform/cli`                      | —       | Optimisation des modèles GLB/GLTF (pipeline `assets:models`). |

---

## ADAPTER-ONLY — intégration écrite, paquet NON installé

Pour ces bibliothèques, le **code d'intégration et un fallback élégant sont déjà écrits**. Le paquet n'est **pas installé** afin de garder le bundle léger et le build sûr. On active la fonctionnalité en installant le paquet (voir `docs/OPTIONAL-INTEGRATIONS.md`).

| Paquet                                           | Rôle prévu                                                                                                                                                                                          | Fallback si absent                         |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `@theatre/core` / `@theatre/studio`              | Animation de caméra pilotée au scroll. Par défaut, cette caméra est livrée **nativement** via GSAP ScrollTrigger + R3F ; l'adaptateur Theatre est documenté. **Studio n'est jamais en production.** | Séquence caméra native GSAP/ScrollTrigger. |
| `@shadergradient/react`                          | Fond dégradé animé par shader (`ShaderGradientBackground`).                                                                                                                                         | Fallback CSS / canvas.                     |
| `liquid-glass-js`, `@paper-design/shaders-react` | Effet « verre liquide » (`GlassSurface`).                                                                                                                                                           | `backdrop-filter` CSS en couches.          |
| `@rive-app/react-canvas`                         | Animations vectorielles interactives (`RiveScene`).                                                                                                                                                 | Poster statique.                           |
| `@splinetool/react-spline`                       | Scènes 3D Spline (`SplineScene`).                                                                                                                                                                   | Poster statique.                           |

---

## REJECTED — exclu du CORE

| Paquet                | Raison                                                                                                                                        |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `@react-three/rapier` | Moteur physique. **WASM lourd**, coût de bundle/perf disproportionné pour la majorité des sites. **Opt-in uniquement** — jamais dans le CORE. |

---

## Pourquoi React est épinglé `<19.3`

React est volontairement figé à **19.2.4 (`<19.3`)** pour garantir la compatibilité avec l'écosystème **React Three Fiber**. R3F 9.x et ses paquets satellites (`drei`, `@react-three/postprocessing`) suivent de près l'API interne du réconciliateur React. Une montée non maîtrisée vers une 19.3+ risque d'introduire une **dérive de peer version** (avertissements d'installation, comportements de rendu imprévisibles en 3D, voire crash du canvas).

Conséquences pratiques :

- `react` et `react-dom` doivent **toujours rester alignés** sur la même version.
- On n'installe jamais avec `--force` ou `--legacy-peer-deps` : ces flags masquent précisément le type d'incompatibilité que le pin cherche à éviter.
- Toute bibliothèque optionnelle qui embarquerait sa propre version de `three` ou exigerait un React plus récent doit être évaluée avec prudence (voir `docs/COMPATIBILITY.md`).

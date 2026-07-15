# Matrice de compatibilité des dépendances

Statuts :

- **CORE** — installé et actif dans le template.
- **OPTIONAL READY** — installé, prêt à l'emploi mais activé au cas par cas.
- **ADAPTER ONLY** — code d'intégration + fallback écrits, **paquet non installé**. On active en installant le paquet.
- **REJECTED** — volontairement exclu du CORE.

> Contrainte transverse : **React est épinglé `19.2.4` (`<19.3`)** pour la compatibilité React Three Fiber. `react` et `react-dom` restent alignés. Ne jamais installer avec `--force` ni `--legacy-peer-deps`.

---

## Matrice

| Dépendance | Statut | Notes |
| --- | --- | --- |
| next 16.2.10 | CORE | App Router + Turbopack |
| react / react-dom 19.2.4 | CORE | épinglé `<19.3` (voir plus bas) |
| typescript 5 | CORE | strict |
| tailwindcss v4 + @tailwindcss/postcss | CORE | CSS-first, tokens en variables CSS |
| cva / clsx / tailwind-merge / lucide-react | CORE | utilitaires UI |
| motion / gsap + ScrollTrigger / lenis | CORE | animation & scroll |
| three 0.185 | CORE | moteur WebGL |
| @react-three/fiber 9.6 / drei 10.7 / postprocessing 3 / postprocessing / maath / zustand / @use-gesture/react | CORE | 3D |
| react-hook-form 7 / zod 4 / @hookform/resolvers 5 | CORE | formulaires |
| maplibre-gl 5 | CORE | cartes, sans clé propriétaire |
| eslint / prettier / vitest 4 / testing-library / jsdom / playwright 1.61 / axe-core / sharp / @gltf-transform/cli | DEV/TEST | outillage |
| @react-three/rapier | **REJECTED** | physique, WASM lourd, opt-in seulement |
| @theatre/core / @theatre/studio | **ADAPTER ONLY** | caméra scroll native par défaut |
| @shadergradient/react | **ADAPTER ONLY** | fond shader |
| liquid-glass-js / @paper-design/shaders-react | **ADAPTER ONLY** | effet verre |
| @rive-app/react-canvas | **ADAPTER ONLY** | animations Rive |
| @splinetool/react-spline | **ADAPTER ONLY** | scènes Spline |

---

## Détail ADAPTER ONLY

### @theatre/core / @theatre/studio
- **Rôle** : animation de caméra pilotée au scroll.
- **Pourquoi non bundlé** : la caméra scroll est déjà livrée **nativement** via GSAP ScrollTrigger + R3F ; Theatre est un raffinement optionnel. **Studio ne doit jamais partir en production.**
- **Activation** : installer `@theatre/core` (+ `@theatre/studio` en dev uniquement).
- **Fallback** : séquence caméra native GSAP/ScrollTrigger (comportement par défaut).

### @shadergradient/react
- **Rôle** : fond dégradé animé par shader (`ShaderGradientBackground`).
- **Pourquoi non bundlé** : coût de bundle et de GPU ; l'effet n'est pas requis sur tous les sites.
- **Activation** : installer `@shadergradient/react`.
- **Fallback** : dégradé CSS / canvas.

### liquid-glass-js / @paper-design/shaders-react
- **Rôle** : effet « verre liquide » (`GlassSurface`).
- **Pourquoi non bundlé** : poids et rendu GPU variable selon les appareils.
- **Activation** : installer le paquet souhaité.
- **Fallback** : `backdrop-filter` CSS en couches.

### @rive-app/react-canvas
- **Rôle** : animations vectorielles interactives (`RiveScene`).
- **Pourquoi non bundlé** : dépend d'un asset `.riv` fourni par projet.
- **Activation** : installer `@rive-app/react-canvas` + fournir le fichier `.riv`.
- **Fallback** : poster statique.

### @splinetool/react-spline
- **Rôle** : scènes 3D Spline (`SplineScene`).
- **Pourquoi non bundlé** : dépend d'un asset Spline ; embarque son propre runtime 3D.
- **Activation** : installer `@splinetool/react-spline` + fournir la scène.
- **Fallback** : poster statique.

---

## Détail REJECTED

### @react-three/rapier
- **Rôle prévu** : physique dans les scènes 3D.
- **Raison du rejet** : **WASM lourd**, impact bundle/perf disproportionné. **Opt-in strict** : à n'installer que si un projet le justifie réellement, jamais dans le CORE.

---

## Risque : bibliothèques optionnelles embarquant leur propre `three`

Certaines bibliothèques optionnelles (typiquement les runtimes 3D tiers comme Spline) peuvent **embarquer leur propre version de `three`**. Cela peut provoquer :

- un **doublon de `three`** dans le bundle (poids accru) ;
- des **incompatibilités** si leur version diverge de `three@0.185` du CORE.

Avant d'activer une intégration ADAPTER ONLY, vérifier l'arbre de dépendances (`pnpm why three`) et privilégier une résolution unique de `three`. En cas de conflit avec le pin React ou la version de `three`, ne pas contourner avec `--force` : réévaluer le besoin.

---

## Rappel du pin React 19.2

R3F 9.x suit de près l'API interne du réconciliateur React. Une 19.3+ non maîtrisée peut casser le rendu 3D. On conserve donc `react`/`react-dom` à `19.2.4`, alignés, sans flags de contournement. Détails dans `docs/STACK.md`.

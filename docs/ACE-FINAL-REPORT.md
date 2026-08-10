# ACE — Rapport final de clôture

Document **interne au moteur** (élagué à la génération). État de clôture d'ACE
— Aurexia Cinematic Engine : une template-moteur produisant des sites premium
**profondément différents** à partir d'un contrat client, sans reconstruire les
fondations à chaque fois.

## 1. Architecture finale

- **Next.js 16** (App Router, Turbopack) · **React 19.2** (<19.3) · **TS
  strict** · **Tailwind v4** (tokens CSS-first).
- Couche moteur `src/ace/` : `core` (registres/contrats/version), `config`
  (contrat client Zod + Design Language + features), `recipes` (familles de
  composition), `motion`/`scenes`/`media`/`content`/`seo`/`forms`/`analytics`.
- Rendu **config-driven** : `src/components/site/ConfiguredHome.tsx`,
  `ConfiguredHeader.tsx`, `SceneBand.tsx` montent les recipes sélectionnées à
  partir de `src/config/{client.resolved.ts, site-content.ts}` (générés).
- Générateur `scripts/ace/new-site.mjs` : `git archive` → élagage → injection
  → anti-fuite → quality gates.
- Studio interne `/ace-lab` (dont `RecipeMatrix`) — jamais expédié en client.

Version moteur : **ACE_VERSION 0.1.0**.

## 2. Contrat client (`src/ace/config/client-schema.ts`)

Schéma Zod universel, sector-agnostic (11 industries, `other` par défaut) :
`identity`, `industry`, `audience`, `goals`, `design`, `features`, `recipes`,
`pages`, `collections`, `team`, `form`, `seo`, `analytics`, `privacy`,
`proposal`, `contact`. Config minimale = juste `identity.name`. Source de
vérité unique — le générateur ne duplique jamais le schéma.

**Feature flags** (`features.ts`) : certains explicites, d'autres dérivés des
intensités. Chaque flag a un effet RÉEL (voir `ACE-GENERATION-CONTRACT.md §3`) :
`webgl`, `collections`, `stickyMobileCta`, `darkMode`, `analytics`, `i18n`…

## 3. Design Language

8 presets (`neutral`, `onyx`, `atelier` + 5 profils de validation :
`editorial-light`, `precision-dark`, `organic-warm`, `technical-cool`,
`luxury-minimal`). Axes profonds : brand, **surfaces** (clair/sombre),
**ombres**, **densité** (contentWidth/sectionSpace), rayons. **AA par
construction** (tests de contraste sur chaque preset).

## 4. Recipes (toutes les familles)

| Famille      | Recettes                                                                                  |
| ------------ | ----------------------------------------------------------------------------------------- |
| hero         | typographic, media-first, split-narrative                                                 |
| navigation   | minimal-header, editorial-folio, immersive-overlay, traditional-premium                   |
| projects     | visual-grid, editorial-index, horizontal-chapters, case-study-sequence                    |
| storytelling | linear-sections, alternating-narrative, chaptered-story, data-led-story, immersive-scroll |
| conversion   | minimal-contact, premium-inquiry, qualification-form, appointment-ready                   |
| layout       | editorial-layout, immersive-layout, product-layout, institutional-layout                  |

Profils **Motion** : restrained, editorial, cinematic, immersive.
Profils **Scene** : no-scene, ambient-accent, product-focus, immersive-environment.

Génériques, token-driven, sans identité. Sélectionnés par id dans le contrat,
validés avant génération, rendus par `ConfiguredHome`/`ConfiguredHeader`.

## 5. Rendu config-driven

`ConfiguredHome` : hero → (scène WebGL si `features.webgl` via `SceneBand`
lazy) → storytelling → collection (si `features.collections`) → conversion,
chacun via la recipe résolue avec fallback runtime (`has*Recipe`).
`ConfiguredHeader` : recipe de navigation résolue + ThemeToggle si `darkMode`.
**Perf critique** : `SceneBand` charge three.js via `next/dynamic` — un site
sans WebGL ne télécharge aucun chunk three.

## 6. Générateur & Studio

Générateur : `pnpm ace:new-site --name --slug --brief --config --content
--assets --out [--url --force --skip-install --skip-check]`. Pipeline :
validation Zod/features/recipes (avant écriture) → export tracké → élagage
Studio/Lab/Engine + docs/fixtures internes → contrat d'entrée copié → assets +
manifeste → identité/DL/features/recipes/contenu → routes → mode privé →
anti-fuite → rapport → quality gates. Voir `ACE-GENERATION-CONTRACT.md`,
`ACE-GENERATOR-QUALITY-GATES.md`.

Studio (`/ace-lab`) : `RecipeMatrix` compare recipes × Design Language ×
viewport × thème × reduced-motion. Isolement prouvé : routes/composants/tests
Studio-Lab-Engine physiquement absents des sites générés + garde-fou
automatisé (aucun test client n'importe/visite un chemin élagué).

## 7. Les deux validations opposées

Générées **exclusivement** par `ace:new-site` (voir commandes ci-dessous).

|                 | Éditoriale (Revue Liseré) | Immersive (Orbe)                            |
| --------------- | ------------------------- | ------------------------------------------- |
| Design Language | editorial-light           | precision-dark                              |
| hero            | typographic               | media-first                                 |
| navigation      | editorial-folio           | immersive-overlay                           |
| projects        | editorial-index           | horizontal-chapters                         |
| storytelling    | alternating-narrative     | immersive-scroll                            |
| conversion      | minimal-contact           | premium-inquiry                             |
| layout          | editorial-layout          | immersive-layout                            |
| Motion          | subtle                    | cinematic                                   |
| Scene           | no-scene                  | immersive-environment (demo.product-reveal) |
| WebGL           | **non**                   | **oui**                                     |
| densité         | spacious                  | compact                                     |

### Commandes exactes

```bash
node scripts/ace/new-site.mjs --name "Revue Liseré" --slug ace-validation-editorial \
  --brief validation-inputs/editorial/CLIENT_BRIEF.md --config validation-inputs/editorial/client.config.ts \
  --content validation-inputs/editorial/content --assets validation-inputs/editorial/assets \
  --out /workspaces/ace-validation-editorial

node scripts/ace/new-site.mjs --name "Orbe" --slug ace-validation-immersive \
  --brief validation-inputs/immersive/CLIENT_BRIEF.md --config validation-inputs/immersive/client.config.ts \
  --content validation-inputs/immersive/content --assets validation-inputs/immersive/assets \
  --out /workspaces/ace-validation-immersive
```

### Résultats exacts (après régénération au dernier commit)

- **Génération** : les deux vertes (install + format + lint + typecheck + tests
  - build).
- **`pnpm check`** : vert dans chaque validation (134 tests unitaires chacune).
- **E2E** : 22/22 chacune — Chromium **desktop + mobile + forms** (home, skip
  link, conversion mobile, 404, routes standard, a11y axe, reduced-motion,
  formulaire desktop+mobile).
- **WebGL prouvé** (`pnpm ace:audit-webgl`, audit strict après revue) :
  - éditorial `--expect none` → **0 chunk WebGL, 0 canvas** (défilement complet
    inclus) ;
  - immersif `--expect webgl` → **4 chunks three.js réellement chargés** (preuve
    du câblage même si le GL logiciel headless retombe ensuite sur le poster),
    et sous reduced-motion **poster visible (fallbackCount>0, canvasCount=0),
    h1 lisible**. Un fallback seul SANS chunk est refusé (scène cassée ≠ WebGL
    câblé).
- **Isolation** : aucune route `/lab`-`/ace-lab`-`/engine`, aucun composant
  Studio, aucun test moteur interne, aucune identité étrangère (pas d'« Orbe »
  dans l'éditorial ni de « Liseré » dans l'immersif), robots noindex + sitemap
  vide (proposition privée).

## 8. Preuve anti-template

Voir `docs/ACE-ANTI-TEMPLATE-VALIDATION.md`. Proximités structurelles
(seuil 0.5) : Site témoin A↔éditoriale **0.016**, Site témoin A↔immersive **0.079**,
éditoriale↔immersive **0.060**. **Verdict : concluant.** Opposition prouvée au
RENDU (silhouette, navigation, collection, palette, densité, mouvement, WebGL,
mobile) — captures dans `docs/anti-template/captures/`.

## 9. Revue finale indépendante

Une passe de revue adversariale indépendante a couvert architecture, contrat
client, générateur, recipes, Design Language, ConfiguredHome/Header, Studio,
isolation, validations, WebGL conditionnel, anti-template, mobile,
accessibilité, performance, sécurité, maintenance, DX, reproductibilité.
Méthode : proposition → réfutation → correction des findings confirmés →
nouveaux tests → revalidation. Résultat détaillé : voir la section « Revue »
ci-dessous.

### Findings confirmés et corrigés

| #   | Sévérité | Finding                                                                                                                                                                                                                                                                                         | Correction                                                                                                                                                                                                                                         |
| --- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | MEDIUM   | `recipes.layout` n'avait aucun effet DOM en client (lu seulement par le Studio, élagué) ; `density`/`motionIntensity`/`webglIntensity` sur `resolvedClient` non lus. Deux configs différant par le seul layout rendaient un DOM identique tout en comptant « distinctes » dans l'anti-template. | `LAYOUT_MAIN_CLASS` (source unique) + `layoutMainClass()` ; `ConfiguredHome` enveloppe le corps dans `[data-layout]` avec la classe du layout + rythme piloté par `--section-space` (densité). Layout + densité réellement observables (+3 tests). |
| 2   | MEDIUM   | `audit-webgl --expect webgl` faux-positif : un poster de fallback seul (GL logiciel / scène cassée) passait « WebGL câblé ».                                                                                                                                                                    | Exige un **chunk three.js réellement chargé** (`webglChunks>0`). Un fallback sans chunk est refusé.                                                                                                                                                |
| 3   | MEDIUM   | La passe reduced-motion acceptait un état vide (`canvasCount===0` suffisait).                                                                                                                                                                                                                   | Exige un **poster visible** (`fallbackCount>0` ET `canvasCount===0`).                                                                                                                                                                              |
| 4   | MEDIUM   | Réécriture de `layout.tsx` (2 `.replace`) sans vérifier que les ancres existent → layout incohérent silencieux possible si la source dérive.                                                                                                                                                    | Échec explicite (`die`) si une ancre est introuvable, avant écriture.                                                                                                                                                                              |
| 5   | LOW      | Repli `has*Recipe` silencieux sur un id mal saisi à la main dans `client.resolved.ts`.                                                                                                                                                                                                          | `console.warn` (dev) quand le repli s'active.                                                                                                                                                                                                      |
| 6   | LOW      | L'audit ne défilait pas la page → un chunk WebGL déclenché plus bas (lazy au scroll) pouvait échapper au comptage.                                                                                                                                                                              | Défilement complet avant comptage (passes normale + reduced-motion).                                                                                                                                                                               |

### Points vérifiés et jugés sains (pas de défaut réel)

- **Injection TS via `content.json`** : valeurs émises via `JSON.stringify`
  (littéraux JSON entre guillemets) — backticks/`${}`/quotes/backslashes inertes.
  JSON malformé → `die`.
- **Formule/seuil anti-template** : les paires réelles scorent 0.016–0.079 ≪ 0.5.
  Le plancher catégoriel (≈0.578) fait dépasser le seuil dès que deux sites
  partagent recipes+design+motion/scene/webgl/density. Seuil défendable.
- **Isolation des tests** : chaque spec conservée ne référence que des
  routes/contenus qui survivent à la génération ; chaque spec important un
  chemin élagué est elle-même élaguée. Aucune fuite.

## 10. Limites résiduelles honnêtes

- **Navigateurs** : seul Chromium est installé dans le sandbox (binaires
  Firefox/WebKit absents). Couverture = Chromium desktop + mobile. À relancer
  sur Firefox/WebKit ailleurs.
- **WebGL headless** : rendu sur GL logiciel — le rendu GPU matériel est plus
  riche ; les captures sont indicatives.
- **Fingerprint Site témoin A** : observationnel (site hand-built figé, antérieur
  aux recipes). Ses `recipes.*` sont des rapprochements documentés.
- **Contenu généré** : neutre/`[À CONFIRMER]` par défaut — un vrai client
  remplace chaque fait vérifié avant publication.
- **Pages standard non-home** (`/a-propos`, `/offre`, `/mentions-legales`) :
  la home est config-driven, mais ces pages de démo gardent le contenu
  scaffolding du starter (prose générique de gabarit, **aucun fait inventé** —
  ni chiffre, ni prix, ni avis). Un vrai client les réécrit ; les quality gates
  ne bloquent pas ce scaffolding car il est manifestement placeholder. Câbler
  ces pages sur `content.json` est une amélioration future identifiée.
- **Design Language** : 8 presets ; un client très spécifique peut nécessiter
  un nouveau preset (AA par construction, testé).

## 11. État Git & sécurité

- Historique de commits locaux cohérents (voir `git log`).
- **Aucun push. Aucun déploiement. Aucune modification de domaine.**
- Aucun secret committé. Site témoin A figé, jamais modifié.
- Les deux validations sont des dossiers reproductibles **hors Git**
  (`/workspaces/ace-validation-*`) ; leur génération est documentée exactement
  (§7). Leurs `node_modules`/`.next` ne sont jamais committés.

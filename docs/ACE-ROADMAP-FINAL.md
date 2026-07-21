# ACE — Roadmap finale (audit des lacunes → moteur complet)

> Audit sous-système par sous-système : ✅ existe et tient · 🟡 existe mais
> partiel · ❌ manquant. Le moteur ne recrée pas ce qui marche ; il complète les
> lacunes réelles.

## Audit par sous-système

| Sous-système        | État | Existe                                                                                                                            | Lacune réelle                                                                 |
| ------------------- | ---- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **core**            | ✅   | `createRegistry`, contrats (AnimationEngine, ReducedMotionPolicy, TierAware, Skippable, RequiresFallback, LazyComponent), version | —                                                                             |
| **config (DA)**     | 🟡   | design-language Zod, presets neutral/onyx/atelier, contrast AA, resolve→CSS                                                       | DA n'agit que sur brand/radius/glow ; pas d'axes typo/densité/grille/matières |
| **config (client)** | ❌   | `src/config/*` ad-hoc, non validé                                                                                                 | **Contrat client universel typé (Zod) absent** — keystone                     |
| **features**        | ❌   | —                                                                                                                                 | Pas de feature flags déclaratifs                                              |
| **layout**          | 🟡   | header/footer/nav/theme starter                                                                                                   | Non piloté par recipe (une seule variante)                                    |
| **ui**              | ✅   | button, field, card, dialog, drawer, section, typography, states…                                                                 | —                                                                             |
| **motion**          | 🟡   | registry 9 recettes, SmoothScroll, séparation typée                                                                               | Pas de recipes de composition (seulement micro-briques)                       |
| **scenes**          | ✅   | registry, AdaptiveCanvas, tiers, fallback obligatoire, context-loss                                                               | Bibliothèque de scènes procédurales à élargir (optionnel)                     |
| **media**           | 🟡   | contrats image/vidéo (poster+dim+captions imposés)                                                                                | Composants de galerie/média recipes absents                                   |
| **content**         | 🟡   | `ContentValue` verified/to-confirm                                                                                                | Pas de modèle de collections générique typé                                   |
| **seo**             | ✅   | metadata, JSON-LD (LocalBusiness/FAQ/Breadcrumb), sitemap, robots, OG                                                             | Générateur JSON-LD sectoriel à étendre (optionnel)                            |
| **forms**           | ✅   | RHF+zod, adaptateurs env-gated, honeypot+throttle, a11y                                                                           | Champs pilotés par config (optionnel)                                         |
| **analytics**       | ✅   | events typés, env-gated                                                                                                           | —                                                                             |
| **performance**     | ✅   | tiers, budgets, AdaptiveDpr, lazy imports                                                                                         | —                                                                             |
| **accessibility**   | ✅   | skip link, focus, reduced-motion, axe e2e                                                                                         | —                                                                             |
| **testing**         | ✅   | Vitest+RTL, Playwright+axe, helpers, polyfills                                                                                    | —                                                                             |
| **audit**           | 🟡   | `audit-site.mjs`                                                                                                                  | À étendre (quality gates générateur)                                          |
| **generator**       | 🟡   | git archive, prune, stamp, leak check                                                                                             | N'ingère pas config/brief/assets ; n'active pas features/routes               |
| **recipes**         | ❌   | —                                                                                                                                 | **Système de recipes absent** — keystone créatif                              |
| **Studio/Lab**      | 🟡   | `/ace-lab` (presets, contrastes, motion, scene studio)                                                                            | À étendre en banc d'essai de recipes ; exclusion prouvée par test             |

## Séquence (dépendances)

```
Phase 2 (contrat client + features)  ← keystone, débloque tout
        ↓
Phase 3 (recipes registres + familles)   Phase 4 (DA élargie)
        ↓                                        ↓
Phase 5 (générateur config-aware) ─────────────┘
        ↓
Phase 6 (Studio)  →  Phase 7 (2 validations opposées)  →  Phase 8 (anti-template)  →  Phase 9 (gates + rapport)
```

## Principe d'exécution

Chaque phase : livrable typé + tests + `pnpm check` vert + aucun secret/identité
client dans le moteur + aucun push. Les validations (Phase 7) sont des **preuves
jetables** du moteur, pas des clients à perfectionner.

## Priorité de cette itération

**Phase 2 en premier** (contrat client universel) : sans lui, ni recipes ni
générateur config-aware ne peuvent exister. Puis l'**infrastructure de recipes**
(Phase 3) avec au moins une famille réelle prouvant la composition/variation.

## Statut d'avancement — CLÔTURE

| Phase                                                                                               | Statut                                                                                                                           |
| --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1 — Audit + roadmap                                                                                 | ✅ fait                                                                                                                          |
| 2 — Contrat client universel (Zod + features)                                                       | ✅ fait et testé (`src/ace/config/client-*.ts`, `features.ts`)                                                                   |
| 3 — Recipes (toutes les familles)                                                                   | ✅ fait et testé (hero×3, navigation×4, projects×4, storytelling×5, conversion×4, layout×4 + motion×4/scene×4 profils)           |
| 4 — Design Language universel (surfaces/ombres/densité)                                             | ✅ fait et testé (8 presets dont 5 profils de validation, AA par construction)                                                   |
| 5 — Générateur config-aware (`--config/--brief/--content/--assets`, features/routes, quality gates) | ✅ fait et testé (`scripts/ace/new-site.mjs`, 25 tests CLI)                                                                      |
| 6 — Studio + isolation Studio/Lab/Engine prouvée                                                    | ✅ fait et testé (RecipeMatrix, garde-fous d'isolement)                                                                          |
| 6.5 — Rendu config-driven (recipes réellement appliquées)                                           | ✅ fait et testé (`ConfiguredHome`/`ConfiguredHeader`/`SceneBand`, contenu généré)                                               |
| 7 — Deux validations opposées (éditoriale / immersive)                                              | ✅ fait — générées par `ace:new-site`, `pnpm check` vert, e2e desktop+mobile+forms+axe+reduced-motion (22 chacune)               |
| 8 — Preuve anti-template                                                                            | ✅ fait — fingerprints + comparaison automatisée (proximités 0.016/0.079/0.060 < 0.5), rapport `ACE-ANTI-TEMPLATE-VALIDATION.md` |
| 9 — Quality gates finaux + rapport                                                                  | ✅ fait — `ACE-FINAL-REPORT.md`, revue indépendante, gates verts moteur + 2 validations                                          |

**État final** : `pnpm check` moteur vert (lint + typecheck + 175 tests + build).
Les deux validations : `pnpm check` vert (131 tests chacune), e2e chromium
desktop+mobile+forms verts, axe vert, WebGL prouvé (éditorial 0 chunk /
immersif 4 chunks + canvas + fallback reduced-motion). Aucune identité
IN QUARTO dans le moteur ni dans les validations. Aucun push. Aucun déploiement.

Voir `docs/ACE-FINAL-REPORT.md` (rapport de clôture) et
`docs/ACE-NEXT-CLIENT-RUNBOOK.md` (procédure prochain client).

## Limite d'environnement documentée

Seul Chromium est installé dans le sandbox (binaires Firefox/WebKit absents).
La couverture navigateur = Chromium desktop + mobile (Pixel 7). Firefox/WebKit
sont à relancer sur un environnement où `pnpm exec playwright install` a été
exécuté.

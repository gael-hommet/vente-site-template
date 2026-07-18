# ACE — Roadmap finale (audit des lacunes → moteur complet)

> Audit sous-système par sous-système : ✅ existe et tient · 🟡 existe mais
> partiel · ❌ manquant. Le moteur ne recrée pas ce qui marche ; il complète les
> lacunes réelles.

## Audit par sous-système

| Sous-système | État | Existe | Lacune réelle |
| --- | --- | --- | --- |
| **core** | ✅ | `createRegistry`, contrats (AnimationEngine, ReducedMotionPolicy, TierAware, Skippable, RequiresFallback, LazyComponent), version | — |
| **config (DA)** | 🟡 | design-language Zod, presets neutral/onyx/atelier, contrast AA, resolve→CSS | DA n'agit que sur brand/radius/glow ; pas d'axes typo/densité/grille/matières |
| **config (client)** | ❌ | `src/config/*` ad-hoc, non validé | **Contrat client universel typé (Zod) absent** — keystone |
| **features** | ❌ | — | Pas de feature flags déclaratifs |
| **layout** | 🟡 | header/footer/nav/theme starter | Non piloté par recipe (une seule variante) |
| **ui** | ✅ | button, field, card, dialog, drawer, section, typography, states… | — |
| **motion** | 🟡 | registry 9 recettes, SmoothScroll, séparation typée | Pas de recipes de composition (seulement micro-briques) |
| **scenes** | ✅ | registry, AdaptiveCanvas, tiers, fallback obligatoire, context-loss | Bibliothèque de scènes procédurales à élargir (optionnel) |
| **media** | 🟡 | contrats image/vidéo (poster+dim+captions imposés) | Composants de galerie/média recipes absents |
| **content** | 🟡 | `ContentValue` verified/to-confirm | Pas de modèle de collections générique typé |
| **seo** | ✅ | metadata, JSON-LD (LocalBusiness/FAQ/Breadcrumb), sitemap, robots, OG | Générateur JSON-LD sectoriel à étendre (optionnel) |
| **forms** | ✅ | RHF+zod, adaptateurs env-gated, honeypot+throttle, a11y | Champs pilotés par config (optionnel) |
| **analytics** | ✅ | events typés, env-gated | — |
| **performance** | ✅ | tiers, budgets, AdaptiveDpr, lazy imports | — |
| **accessibility** | ✅ | skip link, focus, reduced-motion, axe e2e | — |
| **testing** | ✅ | Vitest+RTL, Playwright+axe, helpers, polyfills | — |
| **audit** | 🟡 | `audit-site.mjs` | À étendre (quality gates générateur) |
| **generator** | 🟡 | git archive, prune, stamp, leak check | N'ingère pas config/brief/assets ; n'active pas features/routes |
| **recipes** | ❌ | — | **Système de recipes absent** — keystone créatif |
| **Studio/Lab** | 🟡 | `/ace-lab` (presets, contrastes, motion, scene studio) | À étendre en banc d'essai de recipes ; exclusion prouvée par test |

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

## Statut d'avancement (honnête)

| Phase | Statut |
| --- | --- |
| 1 — Audit + roadmap | ✅ fait (ces 3 docs) |
| 2 — Contrat client universel | ✅ **fait et testé** (`src/ace/config/client-*.ts`, `features.ts`, `types.ts`, 9 tests). Keystone livré. |
| 3 — Recipes | 🟡 **infrastructure + famille heroes faites et testées** (`src/ace/recipes/`, 3 recettes distinctes, 5 tests). Familles navigation/projects/storytelling/conversion : **à construire** (mêmes patterns). |
| 4 — DA élargie | ⏳ à faire (axes typo/densité/grille/matières) |
| 5 — Générateur config-aware (`--config/--brief/--assets`, activation features/routes, quality gates) | ⏳ à faire |
| 6 — Studio (bancs d'essai recipes) + test d'absence Lab/Engine en client | ⏳ à faire |
| 7 — Deux validations opposées (editorial / immersive) | ⏳ à faire (dépend de 3-complet + 5) |
| 8 — Preuve anti-template | ⏳ à faire (dépend de 7) |
| 9 — Quality gates finaux + `ACE-FINAL-REPORT.md` | ⏳ à faire |

`pnpm check` moteur **vert** à ce jalon (lint + typecheck + 102 tests + build).
Aucune identité IN QUARTO dans le moteur. Aucun push.

## Procédure « prochain client » (état actuel)

1. Écrire une `client.config.ts` conforme au contrat (`loadClientConfig` valide
   et résout les features, échoue proprement sur incohérence).
2. Choisir des recipes par famille (`recipes.hero = "media-first"`…) — heroes
   disponibles ; les autres familles restent à câbler.
3. `pnpm ace:new-site …` (aujourd'hui : `--name/--out/--preset` ; l'ingestion
   `--config/--brief/--assets` est la Phase 5).
4. Habiller via un preset Design Language + fontes propres au client.

Ce qui manque pour une génération 100 % pilotée par config : compléter les
familles de recipes (3), câbler le générateur sur le contrat (5), et prouver la
variabilité par deux validations opposées (7–8).

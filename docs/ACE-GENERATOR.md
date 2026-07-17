# ace:new-site — générateur de sites clients

> 2026-07-17 · Validé de bout en bout sur un site témoin (voir §3).

## Usage

```bash
pnpm ace:new-site --name "Nom du site" --out ../mon-site [--preset onyx] [--url https://…]
```

Presets : `neutral` (défaut) · `onyx` · `atelier` — tous **AA par construction**
(testés unitairement à ≥ 4,7:1 pour absorber la variance de rendu navigateur).

## Garanties

1. **Export `git archive HEAD`** : seuls les fichiers *trackés* partent — `.env*`, caches, node_modules, rapports de test ne peuvent pas fuir, par construction.
2. **Élagage des documents internes** du moteur (`docs/audits`, `docs/captures`, plans, RECOVERY) : un site client ne transporte ni l'historique du moteur ni les références à d'autres clients.
3. **Stamp** : `ace.meta.json` (version moteur + commit source + preset + date) → base des mises à jour par diff de template ; `package.json:name` slugifié ; identité runtime dans `.env.local` (aucun secret).
4. **Contrôle de fuite bloquant** : motifs de secrets (clés API, clés privées), identités d'autres clients (liste `FOREIGN_IDENTITY_PATTERNS` à étendre à chaque nouveau client), fichiers interdits, médias > 500 Ko → la génération échoue.

## 3. Validation bout en bout (site témoin)

`Site Témoin ACE` généré avec `--preset onyx` dans `/workspaces/ace-temoin` :

- `pnpm install --frozen-lockfile` : ~5 s (store pnpm partagé) ;
- `pnpm check` : **vert** (lint + typecheck + 89 tests + build, 14 routes) ;
- e2e chromium desktop + mobile (starter, ACE Lab, axe a11y, reduced-motion) : **verts** ;
- vérification visuelle desktop/mobile + captures : `docs/captures/temoin-onyx-*` (l'accent doré onyx s'applique via `NEXT_PUBLIC_ACE_PRESET`, le nom du site via `NEXT_PUBLIC_SITE_NAME`).

Captures de référence du starter neutre : `docs/captures/template-*`.

## 4. Écarts détectés par cette validation (et corrigés)

| Écart | Correction |
| --- | --- |
| Les docs internes (mentionnant IN QUARTO) partaient dans les sites générés | Élagage `ENGINE_ONLY` + motif d'identité étrangère bloquant dans le contrôle de fuite |
| Palettes onyx/atelier sous le seuil AA (détecté par axe sur le témoin : badge 3,77:1) | Maths de contraste dans le moteur (`src/ace/config/contrast.ts`) + tests « AA par construction » sur chaque preset, seuil 4,7:1 (marge navigateur : Chrome mesurait 4,46 là où la référence donnait 4,51) |
| Le switcher de presets du Lab supposait un site en neutral | Initialisation sur le preset du site + émission systématique des tokens (retour à neutral possible par-dessus un preset global) |
| Titres SplitText jamais révélés visuellement (observer sur mot clippé → ratio 0) | Observer déplacé sur le conteneur + stagger par variants ; garde-fou e2e sur l'opacité calculée |

## 5. Limites connues (environnement de test)

MapLibre sur GL logiciel (headless) sature un hôte 2 cœurs : specs `/lab`
isolées dans leur propre projet Playwright, workers en série, budgets de temps
élargis. Aucun impact sur appareils réels (GPU matériel).

# Definition of Done

Porte de sortie avant de déclarer un site livrable. `/finalize-site` s'appuie sur cette checklist. Tant qu'un point n'est pas vert, le site **n'est pas terminé**.

---

## Checklist

### Base technique

- [ ] `pnpm install` **propre** (aucun avertissement de peer, aucun `--force`/`--legacy-peer-deps`).
- [ ] `pnpm lint` → **0 erreur**.
- [ ] `pnpm typecheck` → **0 erreur**.
- [ ] `pnpm test` → **vert** (unitaires).
- [ ] `pnpm build` → **succès**.
- [ ] `pnpm check` (= lint + typecheck + test + build) → vert.

### Rendu

- [ ] La route **`/`** rend correctement.
- [ ] La route **`/lab`** rend correctement.
- [ ] **Aucune erreur console** (ni warning bloquant) au chargement et à l'interaction.

### Accessibilité & résilience

- [ ] **`prefers-reduced-motion` honoré** : animations réduites, pas de mouvement imposé.
- [ ] **Fallback WebGL vérifié** : sans WebGL / en tier LITE, poster/vidéo/séquence s'affiche, pas de canvas noir.
- [ ] Tests a11y (`pnpm test:a11y`) verts.

### Configuration projet

- [ ] **`.claude/` valide** : skills et agents présents et fonctionnels.
- [ ] Le **devcontainer prépare correctement le prochain Codespace** (Node 22, pnpm, ffmpeg, Playwright, install).
- [ ] Le **README décrit le parcours** (brief → build → preview → audit → finalize).

### Contenu & conformité

- [ ] Aucun **fait inventé** : avis, notes, récompenses, prix, adresses proviennent uniquement du brief vérifié (voir `docs/SEO-GUIDE.md`).
- [ ] Métadonnées, JSON-LD, sitemap et robots générés et cohérents.

---

## Ne PAS déclarer « done » si…

- ❌ `lint`, `typecheck`, `test` ou `build` échouent (même « juste un warning »).
- ❌ Des **erreurs console** apparaissent au runtime.
- ❌ Le **fallback WebGL n'a pas été testé** (risque de canvas noir chez l'utilisateur final).
- ❌ `prefers-reduced-motion` **n'est pas respecté**.
- ❌ La route `/` ou `/lab` ne rend pas.
- ❌ Des **assets lourds/originaux** ont été commités ou dépassent les plafonds (`docs/PERFORMANCE-BUDGET.md`).
- ❌ Le contenu contient des **informations non vérifiées** (avis/prix/récompenses inventés).
- ❌ L'installation nécessite `--force` ou `--legacy-peer-deps` (dérive de version à corriger, pas à masquer).
- ❌ Le **devcontainer ne provisionne pas** proprement un nouveau Codespace.
- ❌ `.claude/` (skills/agents) est cassé ou incomplet.

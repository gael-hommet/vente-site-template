# IMPLEMENTATION-PLAN — ACE (Aurexia Cinematic Engine)

> 2026-07-17 · Base : audits `docs/audits/*` · Architecture : Option B
> (`docs/ACE-ARCHITECTURE-DECISION.md`) · Invariant à chaque phase : `pnpm check` vert.

## État de départ (vérifié, pas supposé)

- `pnpm check` **exit 0** le 2026-07-17 (lint + typecheck + 47 tests + build, 9 routes).
- Environnement conforme : Debian 13, Node 22.23.1, pnpm 10.32.1, ffmpeg, git-lfs ; chromium Playwright installé.
- Trois défauts connus (voir MIGRATION-DECISIONS §2) : overrides pnpm ignorés, `.gitattributes` absent, browsers Playwright absents au post-create.

## Phase 0 — Stabilisation ✦ immédiate, ce jour

1. `pnpm-workspace.yaml` : ajouter `overrides: { react: 19.2.4, react-dom: 19.2.4 }` ; retirer le bloc `pnpm` mort de `package.json`.
2. Créer `.gitattributes` (LFS pour sources lourdes : binaires `input/assets`, glb/gltf/hdr/exr/ktx2, masters vidéo/audio, PSD/AI ; `public/**` optimisé reste en git normal).
3. `scripts/post-create.sh` : étape best-effort `pnpm exec playwright install chromium --with-deps` (warn, non bloquante).
4. Revalider : `pnpm install` (lockfile), `pnpm check`.

**Sortie** : base saine, verrou React réel, LFS opérationnel, e2e utilisables sur Codespace neuf.

## Phase 1 — Fondations ACE (`src/ace/`) ✅ faite le 2026-07-17

- 11 modules livrés (`core`, `config`, `ui`, `motion`, `scenes`, `media`, `content`, `seo`, `forms`, `analytics`, `testing`) — voir `docs/ACE-FOUNDATIONS.md`.
- Design Language : 3 presets validés par schéma + `presetToCss` + `<DesignLanguageStyle/>`.
- Motion Library (9 recettes) et Scene Library (3 scènes) sous contrats typés (loi de séparation, skippable et fallback imposés par le typage).
- Page interne `/ace-lab` (noindex, server-rendered) lisant les registres réels.
- 25 tests unitaires ACE + spec e2e `ace-lab.spec.ts`. Aucun composant vert déplacé.

## Phase 2 — Starter neutre ✅ faite le 2026-07-17

- `/` = starter (hero + scène du registre + preuve + offre + FAQ + conversion), routes `/offre`, `/realisations` (état vide designé), `/a-propos`, `/contact`, `/mentions-legales`, `loading`/`error`/`not-found` ; dashboard moteur déplacé sur `/engine` (noindex).
- Faits typés `ContentValue` → `[À CONFIRMER]` visible et testé ; DA montée au layout via `NEXT_PUBLIC_ACE_PRESET` ; CTA sticky mobile ; 42/42 e2e desktop+mobile.

## Phase 3 — `/ace-lab` interactif ✅ faite le 2026-07-17

- Serveur : registres/contrats/budgets. Client isolé : switcher de presets live, contrastes mesurés (zéro paire en échec exigé par l'e2e), aire de jeu motion (recettes + timeline GSAP scrubbable + statut Lenis/ScrollTrigger), Scene Studio (tiers, fallback forcé, perte de contexte WebGL réelle), vitrine conversion/états, choix natifs documentés.

## Phase 4 — Générateur `ace:new-site` ✅ faite le 2026-07-17

- `pnpm ace:new-site` : export `git archive` (fichiers trackés seulement), élagage des docs internes, stamp `ace.meta.json`, contrôle de fuite bloquant. Validé de bout en bout sur un site témoin onyx (check + e2e verts, captures) — voir `docs/ACE-GENERATOR.md` (écarts détectés/corrigés inclus).

## Phase 5 — Site pilote IN QUARTO

- Dérouler le parcours complet réel : brief → ingestion assets (pipeline `assets:*`) → DA → narration (agents art-director / experience-director / copywriter…) → build → audits → finalize. Premier test de vérité du moteur.

## Phases 6+ — Industrialisation étendue (ordre master prompt §40, étapes 10–18)

ACE Studio · Design Language élargi · Motion Library complète · Scene Library ·
Media Intelligence · Originality Engine · **ACE Score / Review Board** (rend
exécutoires les budgets perf + vigilances a11y listés dans les audits) ·
Evolution · validation multi-sites (2ᵉ site test → critères de bascule Option A).

## Règles de conduite (toutes phases)

- `pnpm check` vert avant tout commit significatif ; jamais de test masqué.
- Aucune donnée client inventée ; `business.ts` = faits vérifiés uniquement.
- Aucun déploiement/push externe sans ordre explicite. Aucun secret committé.
- pnpm uniquement ; React < 19.3 ; sources `input/` jamais écrasées.

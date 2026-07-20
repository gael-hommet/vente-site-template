# TOOLING-AUDIT — Outillage build, lint, tests, scripts

> Audit ACE · 2026-07-17

## 1. Chaîne vérifiée verte

`pnpm check` = lint → typecheck → test → build. **Exécuté le 2026-07-17 : exit 0**
(ESLint clean, tsc clean, 47/47 tests, build Turbopack — 9 routes dont
`/api/lead` dynamique).

| Outil           | Config                                                                                          | État                                                                |
| --------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| TypeScript      | `strict: true`, paths `@/*`, moduleResolution bundler                                           | OK                                                                  |
| ESLint 9 (flat) | next/core-web-vitals + next/typescript + ignores ciblés + règle unused-vars `^_`                | OK                                                                  |
| Prettier 3      | + prettier-plugin-tailwindcss ; `format` / `format:check`                                       | OK (non inclus dans `check` — voir §3)                              |
| Vitest 4        | jsdom, globals, setup RTL, unit only (e2e exclus)                                               | OK                                                                  |
| Playwright 1.61 | 4 projets (chromium desktop/mobile, firefox, webkit), webServer `pnpm start`, PW_DEV=1 pour dev | Chromium installé ; firefox/webkit absents (skip toléré par design) |
| axe-core        | via @axe-core/playwright dans a11y.spec                                                         | OK                                                                  |

## 2. Scripts maison

- `scripts/audit-site.mjs` — audit du site (`pnpm audit:site`).
- `scripts/assets/{audit,images,video,models,all}.mjs` — pipeline sharp/ffmpeg/gltf-transform, sources `input/` jamais écrasées, sorties `public/`.
- `scripts/post-create.sh` — bootstrap Codespace idempotent (Node, corepack/pnpm, install, PATH persistant, Claude Code).

## 3. Défauts et manques

1. **`pnpm.overrides` dans package.json ignoré par pnpm 10** → à déplacer dans `pnpm-workspace.yaml`. (Corrigé en stabilisation.)
2. **Playwright browsers non installés par post-create.sh** → tout Codespace neuf a des e2e inutilisables jusqu'à installation manuelle. (Corrigé en stabilisation : installation chromium best-effort, non bloquante.)
3. **Pas de `.gitattributes`** alors que git-lfs est installé dans l'image → un `.glb`/vidéo lourd déposé dans `input/` partirait en blob git classique. (Corrigé en stabilisation.)
4. `format:check` n'est pas dans `check` — choix assumé (prettier appliqué au commit), à réévaluer si dérive.
5. Pas de CI GitHub Actions — hors périmètre tant que « ne pas pousser sans ordre » s'applique ; à proposer plus tard.

## 4. Verdict

Outillage complet et fonctionnel ; les trois correctifs de stabilisation sont
petits, sans risque, et ferment les seuls trous réels.

# DEVCONTAINER-AUDIT — Environnement Codespace / Dev Container

> Audit ACE · 2026-07-17

## 1. Environnement réel vérifié (ce Codespace)

- OS : **Debian 13 (trixie)** — conforme à l'image cible (contrairement à l'environnement Alpine de secours documenté dans RECOVERY-STATUS du 2026-07-15).
- Node **v22.23.1** · pnpm **10.32.1** (corepack) · ffmpeg **7.1.5** · git-lfs **3.6.1** · docker absent (normal en Codespace).
- `pnpm install --frozen-lockfile` OK ; `pnpm check` **exit 0** (2026-07-17) ; `playwright install chromium --with-deps` OK.

## 2. Définition (`.devcontainer/`)

- `Dockerfile` : `mcr.microsoft.com/devcontainers/typescript-node:22` + ffmpeg + git-lfs + corepack activé.
- `devcontainer.json` : port 3000 forwardé, `postCreateCommand: bash scripts/post-create.sh`.
- `post-create.sh` : idempotent — Node check, corepack/pnpm, `pnpm install`, PATH persistant `~/.local/bin` (survit aux rebuilds), installation Claude Code (installeur natif → repli npm), onboarding imprimé. Ne casse jamais le build du container sur une étape optionnelle.

## 3. Défauts détectés

| #   | Défaut                                                                                                                                 | Gravité | Correctif                                                                                                                                                                                                                                          |
| --- | -------------------------------------------------------------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Playwright browsers non installés au post-create** → e2e cassés sur tout Codespace neuf jusqu'à install manuelle (~1 min + deps apt) | Moyenne | Ajouter une étape best-effort `pnpm exec playwright install chromium --with-deps` dans post-create.sh (warn, jamais bloquant) — fait en stabilisation                                                                                              |
| 2   | **`.gitattributes` absent** alors que git-lfs est préinstallé : LFS installé mais non configuré                                        | Moyenne | Créer `.gitattributes` couvrant les sources lourdes (`input/assets/**` binaires, `*.glb/.gltf/.hdr/.exr/.ktx2`, masters vidéo) — fait en stabilisation. Les sorties optimisées `public/**` restent en git normal (petites par contrat de pipeline) |
| 3   | `pnpm.overrides` ignoré (pnpm 10) — voir DEPENDENCY-AUDIT P1                                                                           | Moyenne | Déplacer vers `pnpm-workspace.yaml` — fait en stabilisation                                                                                                                                                                                        |

## 4. Verdict

Container fidèle à sa promesse « self-contained » à trois petits correctifs
près, tous appliqués en phase de stabilisation.

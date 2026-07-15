#!/usr/bin/env bash
#
# Codespaces / Dev Container post-create bootstrap for Vente Site Engine.
#
# Goals (all idempotent — safe to re-run after a rebuild or restart):
#   1. Verify Node + pnpm (via corepack).
#   2. Install project dependencies.
#   3. Ensure Claude Code is installed AND stays on a PERSISTENT PATH so the
#      `claude` command survives Codespace rebuilds/restarts.
#   4. Print the new-site onboarding journey.
#
# This script never fails the container build just because an OPTIONAL step
# (e.g. Claude install while offline) could not complete — it warns instead.

set -uo pipefail

BLUE='\033[1;34m'; GREEN='\033[1;32m'; YELLOW='\033[1;33m'; RED='\033[1;31m'; DIM='\033[2m'; NC='\033[0m'
say()  { printf "${BLUE}▸ %s${NC}\n" "$1"; }
ok()   { printf "${GREEN}✓ %s${NC}\n" "$1"; }
warn() { printf "${YELLOW}! %s${NC}\n" "$1"; }
err()  { printf "${RED}✗ %s${NC}\n" "$1"; }

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

printf "\n${BLUE}=== Vente Site Engine — post-create ===${NC}\n\n"

# ---------------------------------------------------------------------------
# 1. Node
# ---------------------------------------------------------------------------
if command -v node >/dev/null 2>&1; then
  ok "Node $(node --version)"
else
  err "Node introuvable. Le dev container doit fournir Node 22 (image typescript-node:22)."
  err "Ouvre le projet dans un Codespace / Dev Container plutôt qu'en local nu."
  exit 1
fi

# ---------------------------------------------------------------------------
# 2. pnpm (via corepack — la version est épinglée dans package.json)
# ---------------------------------------------------------------------------
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
if ! command -v corepack >/dev/null 2>&1; then
  say "Installation de corepack…"
  npm install -g corepack@latest >/dev/null 2>&1 || warn "corepack non installable globalement (droits ?)."
fi
if command -v corepack >/dev/null 2>&1; then
  corepack enable >/dev/null 2>&1 || sudo corepack enable >/dev/null 2>&1 || true
  corepack prepare --activate >/dev/null 2>&1 || true
fi
if command -v pnpm >/dev/null 2>&1; then
  ok "pnpm $(pnpm --version)"
else
  err "pnpm indisponible malgré corepack. Vérifie 'packageManager' dans package.json."
  exit 1
fi

# ---------------------------------------------------------------------------
# 3. Dépendances du projet
# ---------------------------------------------------------------------------
say "Installation des dépendances (pnpm install)…"
if pnpm install; then
  ok "Dépendances installées."
else
  err "pnpm install a échoué — voir la sortie ci-dessus."
  exit 1
fi

# ---------------------------------------------------------------------------
# 4. PATH persistant pour les binaires utilisateur (Claude Code y sera installé)
# ---------------------------------------------------------------------------
LOCAL_BIN="$HOME/.local/bin"
mkdir -p "$LOCAL_BIN"
ensure_path_line() {
  local rc="$1"
  [ -f "$rc" ] || touch "$rc"
  if ! grep -qs 'vente-site-engine:local-bin' "$rc"; then
    {
      echo ''
      echo '# vente-site-engine:local-bin — garde `claude` (et autres binaires user) accessibles après rebuild'
      echo 'export PATH="$HOME/.local/bin:$PATH"'
    } >> "$rc"
  fi
}
ensure_path_line "$HOME/.bashrc"
ensure_path_line "$HOME/.profile"
[ -f "$HOME/.zshrc" ] && ensure_path_line "$HOME/.zshrc"
export PATH="$LOCAL_BIN:$PATH"
ok "PATH persistant configuré ($LOCAL_BIN)."

# ---------------------------------------------------------------------------
# 5. Claude Code — installer si absent, de manière contrôlée et persistante
# ---------------------------------------------------------------------------
if command -v claude >/dev/null 2>&1; then
  ok "Claude Code déjà présent ($(claude --version 2>/dev/null || echo 'version inconnue'))."
else
  say "Claude Code absent — installation via la méthode officielle…"
  # Méthode officielle actuelle : installeur natif (self-update, ~/.local/bin).
  if curl -fsSL https://claude.ai/install.sh | bash >/dev/null 2>&1 && command -v claude >/dev/null 2>&1; then
    ok "Claude Code installé (installeur natif)."
  else
    warn "Installeur natif indisponible (réseau ?). Repli sur npm global…"
    if npm install -g @anthropic-ai/claude-code >/dev/null 2>&1 && command -v claude >/dev/null 2>&1; then
      ok "Claude Code installé (npm global)."
    else
      warn "Claude Code non installé automatiquement (probablement hors-ligne)."
      warn "Installe-le manuellement plus tard : curl -fsSL https://claude.ai/install.sh | bash"
    fi
  fi
fi

if command -v claude >/dev/null 2>&1; then
  ok "claude --version : $(claude --version 2>/dev/null || echo 'ok')"
fi

# ---------------------------------------------------------------------------
# 6. Onboarding
# ---------------------------------------------------------------------------
cat <<'EOF'

────────────────────────────────────────────────────────────
 Vente Site Engine — prêt.

 Créer un site pour un nouveau client :
   1. Remplir       input/CLIENT_BRIEF.md
   2. Déposer       les fichiers dans input/assets/
   3. Lancer        claude
   4. Exécuter      /build-site
   5. Prévisualiser /preview-site   (port 3000 auto-forwardé)
   6. Auditer       /audit-site
   7. Finaliser     /finalize-site

 Commandes utiles : pnpm dev · pnpm check · pnpm assets:all
 Après un rebuild du Codespace : ce script se relance seul.
 Si `claude` manque : ouvre un nouveau terminal (PATH rechargé)
 ou relance  bash scripts/post-create.sh
────────────────────────────────────────────────────────────

EOF

ok "post-create terminé."

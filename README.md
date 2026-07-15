# Vente Site Engine

Template de production pour générer, dans un Codespace, des **sites commerciaux
premium** : cinématiques, interactifs, 3D, performants, responsive, accessibles,
optimisés SEO et conçus pour convertir. **Un dépôt = un seul site client.**

Ce dépôt est l'**usine** (moteur, modules, règles, skills, agents, laboratoire),
pas un site client. La page racine `/` est un tableau de bord ; `/lab` démontre
chaque brique technique sans marque ni asset protégé.

## Pour créer un nouveau site

1. **Créer un dépôt** depuis ce template (« Use this template » sur GitHub).
2. **Ouvrir le Codespace** (le dev container installe tout automatiquement).
3. Compléter **`input/CLIENT_BRIEF.md`** (faits vérifiés uniquement).
4. Déposer les fichiers dans **`input/assets/`** (logo, photos, vidéos, modèles).
5. Lancer **`claude`**.
6. Exécuter **`/build-site`** — recherche, stratégie, direction artistique, choix
   cinématique, code, optimisation, preview et tests.
7. Ouvrir la **preview** (`/preview-site`, port 3000 auto-forwardé).
8. Exécuter **`/audit-site`** (conversion, design, responsive, SEO, a11y, perf).
9. Exécuter **`/finalize-site`** (nettoyage, tests, build prod — **sans déployer**).

## Commandes essentielles

| Commande                                     | Rôle                                                     |
| -------------------------------------------- | -------------------------------------------------------- |
| `pnpm dev`                                   | Serveur de dev (port 3000, `-H 0.0.0.0` pour Codespaces) |
| `pnpm build` / `pnpm start`                  | Build puis serveur de production                         |
| `pnpm check`                                 | **lint + typecheck + test + build** — avant tout commit  |
| `pnpm lint` · `pnpm typecheck` · `pnpm test` | Étapes individuelles                                     |
| `pnpm test:e2e` · `pnpm test:a11y`           | Playwright + axe-core (voir dépannage)                   |
| `pnpm audit:site`                            | Audit statique (SEO, a11y, hygiène)                      |
| `pnpm assets:audit` · `pnpm assets:all`      | Pipeline d'assets (sharp/ffmpeg/gltf)                    |

Skills Claude Code : `/build-site` · `/preview-site` · `/audit-site` ·
`/finalize-site` · `/ingest-assets`.

## Structure du projet

```
src/app/          routes App Router (/, /lab, api/lead, sitemap, robots, manifest)
src/components/   ui · layout · motion · three · media · photo · maps · conversion · effects · analytics · seo · lab
src/scenes/       scènes R3F lourdes (import dynamique, ssr:false)
src/lib/          animation · three · performance · seo · analytics · forms · accessibility · optional
src/config/       business.ts (SOURCE DE VÉRITÉ), site, navigation, motion
input/            CLIENT_BRIEF.md · ASSET_SOURCES.md · assets/ (sources intactes)
public/           assets optimisés servis (assets, models, sequences, posters)
scripts/          post-create.sh · audit-site.mjs · assets/* · convert-video.sh
.claude/          rules/ · agents/ · skills/ · settings.json
docs/             STACK · WORKFLOW · COMPATIBILITY · PERFORMANCE-BUDGET · ASSET-PIPELINE · SEO-GUIDE · TROUBLESHOOTING · DEFINITION-OF-DONE · RECOVERY-STATUS
```

## Fallbacks (rien n'exige WebGL)

Chaque scène 3D passe par une **WebGL boundary** : si WebGL est absent, échoue,
ou sous `prefers-reduced-motion` / save-data / tier LITE, un **fallback**
image/vidéo/poster s'affiche. Le message, l'offre, les coordonnées et le **CTA
restent lisibles et atteignables sans Canvas**. Les intégrations optionnelles
(Rive, Spline, ShaderGradient…) sont chargées à l'exécution et se replient
proprement si le paquet n'est pas installé.

## Clés API : ce qui marche sans, ce qui en a besoin

- **Sans aucune clé** : tout le moteur, `/lab`, la carte (MapLibre keyless), les
  formulaires (endpoint local simulé), le SEO/JSON-LD, l'analytics en logger
  local.
- **Facultatif (env-gated, off par défaut)** : envoi d'email (Resend), webhook
  CRM, réservation (Cal.com), analytics tiers. Voir `.env.example` et
  `docs/OPTIONAL-INTEGRATIONS.md`. Aucune clé n'est committée ; `.env*` est
  gitignore.

## Preview dans Codespaces

`pnpm dev` (ou `/preview-site`) démarre le serveur sur le port **3000**,
auto-forwardé par Codespaces (notification « Open in Browser »). En local :
<http://localhost:3000>.

## Transformer ce dépôt en GitHub Template

Repo → **Settings** → coche **Template repository**. Les futurs sites se créent
via « Use this template » (Phase 1 ci-dessus).

## Récupération après arrêt / reconstruction d'un Codespace

Le travail vit dans le **système de fichiers + Git**, jamais dans une
conversation Claude. Après un arrêt ou une reconstruction :

1. Rouvrir le Codespace. Le dev container relance `scripts/post-create.sh`
   (idempotent) : Node, pnpm, dépendances, et **Claude Code** avec un **PATH
   persistant** (`~/.local/bin`) — `claude` reste disponible après reboot.
2. Si `claude` semble absent : ouvre un **nouveau terminal** (PATH rechargé) ou
   relance `bash scripts/post-create.sh`. Réinstallation manuelle au besoin :
   `curl -fsSL https://claude.ai/install.sh | bash`.
3. Lancer `claude` puis, pour reprendre le contexte, lire
   **`docs/RECOVERY-STATUS.md`** (état factuel) et `docs/WORKFLOW.md`. La reprise
   se fonde sur le dépôt, pas sur l'historique de conversation.
4. Vérifier l'état : `pnpm install && pnpm check`.

## Mise à jour des dépendances

pnpm uniquement ; respecter le lockfile ; **jamais** `--force` ni
`--legacy-peer-deps`. React est épinglé `<19.3` (sinon React Three Fiber casse).

## Dépannage

Voir **`docs/TROUBLESHOOTING.md`**. Points fréquents : port 3000 occupé,
navigateurs Playwright à installer (`pnpm exec playwright install`), avertissement
Git LFS bénin si `git-lfs` est absent, cache Next (`rm -rf .next`).

## Définition de « terminé »

`pnpm check` vert · `/` et `/lab` sans erreur console · reduced-motion respecté ·
fallback WebGL vérifié · SEO/JSON-LD cohérents avec le contenu visible · aucun
secret · aucune info client inventée. Détail : `docs/DEFINITION-OF-DONE.md`.

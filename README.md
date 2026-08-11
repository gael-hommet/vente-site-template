# Vente Site Engine

Template de production pour générer, dans un Codespace, des **sites commerciaux
premium** : cinématiques, interactifs, 3D, performants, responsive, accessibles,
optimisés SEO et conçus pour convertir. **Un dépôt = un seul site client.**

Ce dépôt est l'**usine** (moteur, modules, règles, skills, agents, laboratoire),
pas un site client. La page racine `/` est un tableau de bord ; `/lab` démontre
chaque brique technique sans marque ni asset protégé.

## Prompt → site premium

**Vous n'avez que deux choses à savoir : ouvrir Claude, et dire quel site vous
voulez.** Le reste appartient à ACE.

### Démarrage rapide (aucune compétence technique)

1. **Ouvrir le Codespace** (« Use this template » → Code → Codespaces). Tout
   s'installe seul.
2. Vérifier que tout va bien :
   ```bash
   pnpm ace:doctor
   ```
   Vous devez lire **`ACE READY`**. Si vous lisez `ACE NEEDS ADMIN SETUP`, c'est
   une action d'administrateur (voir plus bas) — ACE sait déjà créer des sites
   sans elle.
3. Lancer **`claude`**.
4. Écrire **une phrase**, par exemple :

   > Fais-moi un site premium pour ce restaurant : https://exemple.fr

   Ou, pour une **visite immersive** à partir de vos photos :

   > Transforme ces quatre images en visite immersive.

   ACE choisit seul comment les mettre en scène (voir
   `docs/ACE-SPATIAL-CAPTURE-GUIDE.md` pour savoir quoi photographier).

   ou :

   > Crée un site pour le cabinet de mon père. Moderne, rassurant et classe.

5. Attendre. ACE cherche les informations, choisit la direction artistique,
   construit le site, le teste, le relit et vous donne l'adresse de l'aperçu.

Ce que vous **n'avez pas** à faire : choisir une palette, comprendre les
commandes, configurer un outil, arbitrer entre « vidéo » et « séquence
d'images ». ACE tranche.

### Ce qu'ACE ne fera jamais tout seul

- publier ou déployer le site (il reste sur votre machine) ;
- inventer une information sur l'entreprise (tout ce qui manque est marqué
  `[À CONFIRMER]`) ;
- livrer un visuel bas de gamme pour combler un manque.

### Aucune configuration, aucun abonnement

ACE **ne génère pas d'images ni de vidéos** via un service payant. Il n'y a donc
**aucune clé d'API à obtenir, aucun crédit à acheter, aucun coût par site**.

Les visuels viennent du réel, dans cet ordre :

1. ce que vous fournissez ;
2. le site officiel de l'entreprise ;
3. ses réseaux officiels ;
4. une image que vous avez créée ailleurs et que vous lui donnez.

Si rien d'utilisable n'existe, ACE vous le dit et vous demande une photo — il ne
fabrique jamais un visuel de substitution.

### Mode expert (développeurs)

Le moteur reste pilotable à la main : `pnpm ace:new-site`, `pnpm ace:media:*`,
`pnpm ace:media:*`, `pnpm check`… Voir
[docs/ACE-AUTOPILOT.md](docs/ACE-AUTOPILOT.md) et les docs `docs/ACE-*`.

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

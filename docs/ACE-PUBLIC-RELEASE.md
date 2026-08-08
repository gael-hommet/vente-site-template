# ACE 0.2 — Notes de release publique (couche média)

Document **interne au moteur**. Prépare une diffusion publique propre de la
couche Creative Media Engine : ce qui est shippé, ce qui est élagué, comment
démarrer, et les garanties de sécurité/honnêteté.

> **Ne pas** pousser, déployer ni publier sans ordre explicite. Ce document
> **prépare** la release ; il ne la déclenche pas.

## Ce qui est livré (réel, vérifiable)

- **Couche de décision média** (`src/ace/media-engine`) : stratégie, storyboard,
  coût, QA structurelle, doctrine anti-low-poly, abstraction de providers.
- **Runtime scroll-cinéma** : `CinematicScroll` au-dessus de `ScrollVideo` /
  `ScrollImageSequence` / `MediaFallback`.
- **CLI honnête** : `ace:media:{capabilities,plan,frames,report}`,
  `ace:provider:check`.
- **Traitement local réel** : extraction de frames webp via ffmpeg (prouvé).
- **Adapter Higgsfield** : codé, guardé, testé — **jamais simulé** (schéma d'API
  à confirmer avant usage réel).
- **Docs** : architecture, providers, Higgsfield, scroll-cinéma, cost guard,
  media QA, anti-low-poly.
- **Tests** : media-engine + cinematic-scroll (dans `pnpm check`).

## Ce qui n'est PAS livré (honnêteté)

- **Aucune génération IA fonctionnelle par défaut** : il faut configurer un
  provider ; même configuré, le mapping de réponse Higgsfield est **À CONFIRMER**.
- CLI `generate` / `qa` / `assemble` / `optimize` : **non fournies** en scripts
  dans cette itération (la logique QA existe en module). À implémenter, jamais à
  simuler. Voir [ACE-MEDIA-ARCHITECTURE.md](ACE-MEDIA-ARCHITECTURE.md).

## Ce qui reste dans un site généré vs élagué

Le générateur `pnpm ace:new-site` distingue **runtime** (shippé) et **outillage
moteur** (élagué) :

| Élément                                                                                                                            | Destin dans un site client |
| ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `src/ace/media-engine/**` (types/logique pure)                                                                                     | **shippé** (réutilisable)  |
| `src/components/media/CinematicScroll.tsx`                                                                                         | **shippé** (runtime)       |
| `scripts/ace/media/**` (CLI interne)                                                                                               | **élagué**                 |
| `docs/ACE-MEDIA-*`, `ACE-PROVIDER-*`, `ACE-HIGGSFIELD-*`, `ACE-COST-*`, `ACE-ANTI-LOW-POLY.md`, `ACE-SCROLL-CINEMA.md`, ce fichier | **élagués**                |
| `tests/unit/media-engine.test.ts`, `tests/unit/cinematic-scroll.test.tsx`                                                          | **élagués** (tests moteur) |
| scripts `ace:media:*` / `ace:provider:*` dans `package.json`                                                                       | **retirés**                |

Voir [ACE-GENERATOR.md](ACE-GENERATOR.md) et
[ACE-GENERATION-CONTRACT.md](ACE-GENERATION-CONTRACT.md) pour le mécanisme.

## Démarrer avec la couche média

1. **Auditer l'environnement** :
   ```bash
   pnpm ace:media:report          # can/can't honnête (ffmpeg, providers, runtime)
   ```
2. **Planifier une expérience** à partir d'un brief JSON (`MediaBriefInput`) :
   ```bash
   pnpm ace:media:plan brief.json # décision + storyboard + coût (exit 1 si blocker)
   pnpm ace:media:plan --demo     # exemple (room-tour photoreal, sans asset)
   ```
3. **Extraire des frames** d'une vidéo pour un scrub :
   ```bash
   pnpm ace:media:frames tour.mp4 --out public/media/tour --fps 12 --width 1280
   ```
4. **Configurer un provider** (optionnel, pour générer) :
   voir [ACE-HIGGSFIELD-SETUP.md](ACE-HIGGSFIELD-SETUP.md) et
   [ACE-PROVIDER-INTEGRATION.md](ACE-PROVIDER-INTEGRATION.md). Statut :
   ```bash
   pnpm ace:provider:check
   ```
5. **Intégrer** le média décidé via `<CinematicScroll strategy={…} … />` — voir
   [ACE-SCROLL-CINEMA.md](ACE-SCROLL-CINEMA.md).

## Sécurité & confidentialité (garanties)

- **Aucun secret committé.** Les credentials providers passent par l'ENV ; le
  moteur ne lit **jamais** un fichier `.env` (gitignoré). Aucune valeur de
  credential n'est loguée (seulement sa présence).
- **Intégrations env-gated** : off par défaut, aucune clé/URL en dur.
- **Aucun fait client inventé** : coûts, capacités et tarifs viennent de la config
  ou d'un audit réel ; sinon c'est déclaré vide/non chiffré.
- **Aucun déploiement/push automatique** : la couche média n'ajoute aucun hook de
  publication.

## Checklist avant diffusion

- [ ] `pnpm check` vert (lint + typecheck + test + build).
- [ ] `pnpm ace:media:report` reflète l'état réel de l'environnement cible.
- [ ] Aucune donnée spécifique à un client dans la couche moteur.
- [ ] Aucun secret / `.env` suivi ; `.env.example` sans valeurs sensibles.
- [ ] Docs média cohérentes avec le code (pas de capacité surévaluée).
- [ ] Élagage du générateur vérifié sur un site de test.

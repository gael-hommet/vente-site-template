# ACE 0.2 — Architecture du Creative Media Engine

Document **interne au moteur** (élagué à la génération). Décrit la couche média
qui fait évoluer ACE d'un moteur qui _intègre_ de beaux assets vers un moteur
qui _décide, planifie, oriente la création, contrôle et assemble_ des médias
premium — **sans jamais dégrader silencieusement l'ambition artistique**.

> Périmètre honnête : cette couche **décide, planifie, route, chiffre, génère
> (via un provider), contrôle, assemble et optimise**. La GÉNÉRATION d'images/
> vidéos dépend d'un provider **authentifié** — sans lui, ACE fait tout le reste
> et refuse explicitement de générer (`PROVIDER_NOT_CONFIGURED` /
> `PROVIDER_AUTH_PENDING`). Rien n'est jamais simulé.
>
> La QA **visuelle** (déformations, artefacts, « trop IA ») n'est pas
> automatisée : `REVIEW_REQUIRED` est une sortie valide et fréquente.

## Principe

Le moteur média est une couche **pure et sérialisable** : elle produit des
plans/rapports (objets typés), jamais des pixels. La CLI Node et les composants
runtime consomment ces plans. Aucune valeur n'est inventée — coûts et capacités
proviennent de la config ou d'un audit réel de l'environnement.

Deux couches ACE cohabitent :

- **A. Site Engine** (existant) : `src/ace/core`, registres, génération de site.
- **B. Creative Media Engine** (cette doc) : `src/ace/media-engine` + la CLI
  `scripts/ace/media/` + le composant runtime `CinematicScroll`.

## Emplacement (décision additive)

Le mandat évoquait des `packages/ace-media-*`, mais le dépôt est **mono-package**
(pas un monorepo). Un refactor en workspaces aurait été destructeur et hors
sujet. Décision **additive**, documentée dans
[ACE-0.2-IMPLEMENTATION-PLAN.md](ACE-0.2-IMPLEMENTATION-PLAN.md) :

```
src/ace/media-engine/            # logique pure, isomorphe (aucun node:*)
  types.ts                       # contrats typés (source de vérité)
  qa-verdict.ts                  # PASS | REVIEW_REQUIRED | REJECT (partagé)
  anti-low-poly.ts               # doctrine non négociable (garde + verdict)
  premium-gate.ts                # ACE PREMIUM OUTPUT GATE (extension)
  strategy.ts                    # chooseStrategy() — quelle technique ?
  model-router.ts                # routeModel() — catalogue RÉEL uniquement
  shot-planner.ts                # buildShotPlan() — storyboard + raccords
  reference-lock.ts              # verrou d'identité du sujet
  plan.ts                        # buildMediaPlan() — plan complet
  cost.ts                        # estimateCost() — estimation a priori
  budget.ts                      # dépense consommée + arrêt au plafond
  qa.ts                          # cadre de scoring (revue humaine)
  art-direction.ts               # reviewArtDirection() — verdict esthétique
  manifest.ts                    # provenance (modèle, promptHash, tentatives)
  orchestrator.ts                # la boucle, avec PORTS INJECTÉS (testable)
  delivery-mode.ts               # video-scroll vs image-sequence (chiffré)
  config.ts                      # lecture ENV (jamais .env)
  providers/
    types.ts                     # contrat MediaProvider (pluggable)
    registry.ts                  # registre fail-safe
    local.ts                     # ffmpeg/sharp/gltf (traitement, pas d'IA)
    higgsfield.ts                # adapter sur CLI officiel (jamais simulé)
  node/                          # ⚠ Node UNIQUEMENT — hors du barrel
    hf-cli.ts                    # pilote du CLI officiel `hf-api`
    provider-runtime.ts          # câblage des capacités réelles
    technical-qa.ts              # QA RÉELLE via ffprobe
    continuity.ts                # continuité v2 (frames + SSIM + couleur)
  index.ts                       # barrel (isomorphe)

scripts/ace/media/               # CLI (outillage interne, élagué à la génération)
src/components/media/CinematicScroll.tsx   # runtime (réutilisable, shippé)
```

Le **runtime** (`CinematicScroll` + `media-engine` en tant que types/logique)
est réutilisable et reste dans les sites générés. La **CLI** et **cette doc**
sont de l'outillage moteur → élagués par `pnpm ace:new-site`.

## Flux de bout en bout

```
brief (intent, qualityBar, assets, contraintes, providers ENV)
        │
        ▼
chooseStrategy() ──► anti-low-poly (garde)     [strategy.ts + anti-low-poly.ts]
        │
        ▼
buildShotPlan() ──► storyboard + raccords refIn/refOut   [shot-planner.ts]
        │
        ▼
estimateCost() ──► cost guard (tarifs config, seuil)     [cost.ts]
        │
        ▼
buildMediaPlan() ──► AceMediaPlan (décision + shots + coût + risques)  [plan.ts]
        │
        ├──► si blocker: PROVIDER_NOT_CONFIGURED / MEDIA_ASSET_REQUIRED  (honnête)
        │
        ▼
(génération éventuelle via provider configuré)  [providers/*]  ← non fourni ici
        │
        ▼
assessMedia() / assessContinuity() ──► QA structurelle + revue humaine   [qa.ts]
        │
        ▼
CinematicScroll ──► intégration scroll-cinéma (runtime)   [components/media]
```

## Les modules (API réelle)

### `types.ts` — contrats

- `AceMediaIntent` : `hero-cinematic` · `room-tour` · `project-reveal` ·
  `scroll-film` · `photo-depth` · `image-sequence` · `ambient-loop`.
- `AceMediaStrategy` : `webgl` · `video-scroll` · `image-sequence` · `2.5d` ·
  `hybrid` · `editorial-fallback`.
- `AceQualityBar` : `photoreal` · `stylized-premium` · `graphic` · `editorial`.
- `AceAvailableAssets` : `continuousVideo`, `frameSequence`, `stillImages`,
  `realModel3d`, `depthMaps` (ce dont on dispose RÉELLEMENT).
- `AceStrategyDecision` : `strategy`, `rationale`, `requirements`, `blocker`
  (`"MEDIA_ASSET_REQUIRED" | "PROVIDER_NOT_CONFIGURED" | null`), `premiumFallback`.
- `AceMediaPlan`, `AceShotPlan`, `AceCostEstimate`, `AceMediaQaReport`,
  `AceContinuityReport`, `AceCapabilityReport`, `AceProviderPricing`.

### `anti-low-poly.ts` — doctrine (voir [ACE-ANTI-LOW-POLY.md](ACE-ANTI-LOW-POLY.md))

`evaluateLowPolyRisk(strategy, qualityBar, assets)` renvoie un verdict ;
`assertNoLowPolySubstitution(...)` **lève une erreur** si la combinaison viole la
doctrine (WebGL + barre haute + pas de modèle 3D réel).

### `strategy.ts` — `chooseStrategy(input)`

Fonction **pure**, ordre de décision (voir la table dans
[ACE-SCROLL-CINEMA.md](ACE-SCROLL-CINEMA.md)) :

1. `continuousVideo` + intention de continuité → `video-scroll`.
2. `frameSequence` (ou vidéo à extraire pour `image-sequence`) → `image-sequence`.
3. `realModel3d` **et** pas de risque low-poly → `webgl`.
4. `stillImages` + `photo-depth`/barre non-photoréaliste → `2.5d`.
5. barre haute + provider configuré → `hybrid` (génération à lancer).
6. barre haute + **aucun** provider → `editorial-fallback` avec **blocker**
   `PROVIDER_NOT_CONFIGURED` (jamais de 3D cheap).
7. sinon → `editorial-fallback` assumé.

### `shot-planner.ts` — `buildShotPlan(intent, strategy)`

Storyboards génériques par intention (gabarits, **aucun fait client inventé**).
Chaîne les raccords : `refIn` d'un plan = `endState` du plan précédent, ce qui
rend la continuité vérifiable par `qa.ts`.

### `cost.ts` — `estimateCost(input)` (cost guard)

Tarifs **exclusivement** depuis `AceProviderPricing` (config, source déclarée).
Trois volumes (`minimal`=1, `recommended`=2, `cautious`=3 sorties/plan). Seuil
d'alerte par défaut `50`. Stratégies locales/gratuites → coût `0`. Sans tarif →
`0` + note honnête. Voir [ACE-COST-GUARD.md](ACE-COST-GUARD.md).

### `qa.ts` — `assessMedia()` / `assessContinuity()`

Cadre de scoring (revue humaine) + heuristiques structurelles vérifiables.
`requiresHumanReview` **toujours vrai** : la QA visuelle IA n'est pas
automatisable ici sans modèle de vision. Voir [ACE-MEDIA-QA.md](ACE-MEDIA-QA.md).

### `providers/` — abstraction pluggable

Contrat `MediaProvider` (`name`, `capabilities`, `status()`, `generate?`).
Registre fail-safe : un provider absent/non configuré est filtré, ne casse jamais
le moteur. Voir [ACE-PROVIDER-INTEGRATION.md](ACE-PROVIDER-INTEGRATION.md).

## CLI

| Commande                                     | Rôle                                                       | État                                       |
| -------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------ |
| `pnpm ace:media:capabilities`                | Audit réel (ffmpeg/ffprobe/sharp/gltf, providers, runtime) | ✅ réel                                    |
| `pnpm ace:media:plan <brief>`                | Décision + storyboard + coût estimé                        | ✅ réel                                    |
| `pnpm ace:media:generate --brief <f>`        | Pipeline orchestré complet                                 | ✅ réel — refuse honnêtement sans provider |
| `pnpm ace:media:qa --manifest <f>`           | QA technique ffprobe + cohérence du manifeste              | ✅ réel                                    |
| `pnpm ace:media:assemble <in...> --out <d>`  | Concat ffmpeg (copy si possible) → master                  | ✅ réel                                    |
| `pnpm ace:media:optimize <master> --out <d>` | Variantes desktop/mobile + poster                          | ✅ réel                                    |
| `pnpm ace:media:frames <video> --out <d>`    | Séquence webp pour le scrub                                | ✅ réel                                    |
| `pnpm ace:media:report`                      | Rapport consolidé can/can't                                | ✅ réel                                    |
| `pnpm ace:provider:check`                    | Statut providers (CLI installé ? authentifié ?)            | ✅ réel                                    |

Codes de sortie de `generate` : `0` succès · `1` aucun plan approuvé · `2` usage
· `3` `PROVIDER_NOT_CONFIGURED` · `4` `PROVIDER_AUTH_PENDING` · `5`
`PROVIDER_CONTRACT_UNVERIFIED`. Aucune sortie n'est simulée.

## La boucle d'orchestration

```
PLAN → RESOLVE MODEL (catalogue réel) → COST CHECK (estimate + plafond)
     → GENERATE → STORE → QA TECHNIQUE (ffprobe) → ART REVIEW
     → PREMIUM GATE → ACCEPT / REJECT → RETRY borné → PLAN N+1
```

Garanties, toutes couvertes par des tests :

- retries bornés par `maxAttemptsPerShot` (jamais de boucle infinie) ;
- arrêt net dès que le budget est atteint ;
- une sortie rejetée n'est **jamais** promue ni assemblée ;
- une erreur d'authentification n'est pas réessayée (inutile et coûteux) ;
- le plan N approuvé devient la **référence forte** du plan N+1.

L'orchestrateur reçoit des **ports injectés** (génération, estimation, QA,
revue, horloge) : la boucle est donc prouvable sans provider payant.

## Ce que la couche NE fait pas

- Elle ne génère **aucun** pixel elle-même (pas d'IA embarquée).
- Elle n'invente ni tarif, ni capacité provider, ni fait client.
- Elle ne rend jamais de 3D procédurale cheap pour un besoin premium.
- Elle ne lit jamais un fichier `.env` (les credentials arrivent par l'ENV).

## Voir aussi

- [ACE-ANTI-LOW-POLY.md](ACE-ANTI-LOW-POLY.md) — la doctrine, codifiée et testée.
- [ACE-PROVIDER-INTEGRATION.md](ACE-PROVIDER-INTEGRATION.md) — brancher un provider.
- [ACE-HIGGSFIELD-SETUP.md](ACE-HIGGSFIELD-SETUP.md) — setup Higgsfield.
- [ACE-SCROLL-CINEMA.md](ACE-SCROLL-CINEMA.md) — intégration runtime.
- [ACE-COST-GUARD.md](ACE-COST-GUARD.md) · [ACE-MEDIA-QA.md](ACE-MEDIA-QA.md).

# ACE 0.2 — Architecture du Creative Media Engine

Document **interne au moteur** (élagué à la génération). Décrit la couche média
qui fait évoluer ACE d'un moteur qui _intègre_ de beaux assets vers un moteur
qui _décide, planifie, oriente la création, contrôle et assemble_ des médias
premium — **sans jamais dégrader silencieusement l'ambition artistique**.

> Périmètre honnête : cette couche **décide, planifie, contrôle, assemble et
> optimise** des médias RÉELS. Elle **ne génère jamais** d'image ni de vidéo :
> aucune API payante, aucun crédit, **coût média 0 €**. S'il manque un visuel
> indispensable, elle le déclare (`MEDIA_ASSET_REQUIRED`) — voir
> [ACE-ASSET-SOURCES.md](ACE-ASSET-SOURCES.md).
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
  asset-source.ts                # hiérarchie des sources + droits + provenance
  qa-verdict.ts                  # PASS | REVIEW_REQUIRED | REJECT (partagé)
  anti-low-poly.ts               # doctrine non négociable (garde + verdict)
  premium-gate.ts                # ACE PREMIUM OUTPUT GATE (extension)
  strategy.ts                    # chooseStrategy() — quelle technique ?
  shot-planner.ts                # buildShotPlan() — storyboard + raccords
  reference-lock.ts              # verrou d'identité du sujet
  plan.ts                        # buildMediaPlan() — plan complet
  qa.ts                          # cadre de scoring (revue humaine)
  art-direction.ts               # reviewArtDirection() — verdict esthétique
  manifest.ts                    # provenance (modèle, promptHash, tentatives)
  delivery-mode.ts               # video-scroll vs image-sequence (chiffré)
  config.ts                      # lecture ENV (jamais .env)
  node/                          # ⚠ Node UNIQUEMENT — hors du barrel
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

### `qa.ts` — `assessMedia()` / `assessContinuity()`

Cadre de scoring (revue humaine) + heuristiques structurelles vérifiables.
`requiresHumanReview` **toujours vrai** : la QA visuelle IA n'est pas
automatisable ici sans modèle de vision. Voir [ACE-MEDIA-QA.md](ACE-MEDIA-QA.md).

## CLI

| Commande                                     | Rôle                                                       | État    |
| -------------------------------------------- | ---------------------------------------------------------- | ------- |
| `pnpm ace:media:capabilities`                | Audit réel (ffmpeg/ffprobe/sharp/gltf, providers, runtime) | ✅ réel |
| `pnpm ace:media:plan <brief>`                | Décision + storyboard + coût estimé                        | ✅ réel |
| `pnpm ace:media:qa --manifest <f>`           | QA technique ffprobe + cohérence du manifeste              | ✅ réel |
| `pnpm ace:media:assemble <in...> --out <d>`  | Concat ffmpeg (copy si possible) → master                  | ✅ réel |
| `pnpm ace:media:optimize <master> --out <d>` | Variantes desktop/mobile + poster                          | ✅ réel |
| `pnpm ace:media:frames <video> --out <d>`    | Séquence webp pour le scrub                                | ✅ réel |
| `pnpm ace:media:report`                      | Rapport consolidé can/can't                                | ✅ réel |

## Ce que la couche NE fait pas

- Elle ne génère **aucun** pixel elle-même (pas d'IA embarquée).
- Elle n'invente ni tarif, ni capacité provider, ni fait client.
- Elle ne rend jamais de 3D procédurale cheap pour un besoin premium.
- Elle ne lit jamais un fichier `.env` (les credentials arrivent par l'ENV).

## Voir aussi

- [ACE-ANTI-LOW-POLY.md](ACE-ANTI-LOW-POLY.md) — la doctrine, codifiée et testée.
- [ACE-SCROLL-CINEMA.md](ACE-SCROLL-CINEMA.md) — intégration runtime.

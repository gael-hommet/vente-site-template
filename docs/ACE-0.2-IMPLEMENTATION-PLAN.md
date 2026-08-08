# ACE 0.2 — Creative Media Autonomous Engine · Plan d'implémentation

Document **interne au moteur**. Fait évoluer ACE d'un moteur qui _intègre_ de
beaux assets vers un moteur qui _décide, planifie, oriente la création,
contrôle et assemble_ les médias premium — sans jamais dégrader silencieusement
l'ambition (règle anti-low-poly, §6).

> Vérité technique : ce plan distingue ce qui EXISTE et tourne, ce qui est
> AJOUTÉ par cette phase, et ce qui reste STUB/dépendant d'un provider externe
> ou d'assets réels. Rien n'est présenté comme fonctionnel s'il ne l'est pas.

## 0. État réel audité (ce qui existe déjà)

| Domaine                                                  | État                              | Détail                                                                                                                                                                            |
| -------------------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dépôt                                                    | **single-package** (pas monorepo) | pas de `packages/` ; la couche moteur vit dans `src/ace/*` en modules. `pnpm-workspace.yaml` documente que c'est un mono-package.                                                 |
| WebGL / R3F                                              | ✅ complet                        | `src/components/three/*` (AdaptiveCanvas, tiers ULTRA/BALANCED/LITE, WebGLBoundary, fallback obligatoire, context-loss, DPR adaptatif), `src/ace/scenes/*` (registry + contrats). |
| Scroll-scrub vidéo                                       | ✅ existe                         | `src/components/media/ScrollVideo.tsx` (progress→currentTime).                                                                                                                    |
| Image sequence (frames)                                  | ✅ existe                         | `src/components/media/ScrollImageSequence.tsx` + `ImageSequencePlayer.tsx`.                                                                                                       |
| 2.5D / depth                                             | ✅ existe                         | `src/components/photo/{DepthParallax,LayeredPhoto,KenBurnsScene,PanoramaAdapter}.tsx`.                                                                                            |
| Fallback média                                           | ✅ existe                         | `src/components/media/MediaFallback.tsx`, contrats `src/ace/media/contracts.ts` (poster/dim/alt imposés).                                                                         |
| Pipeline assets local                                    | ✅ tourne                         | `scripts/assets/{images,video,models,all}.mjs` + `convert-video.sh`. **ffmpeg 7.1.5 installé**, `sharp`, `@gltf-transform/cli`.                                                   |
| Génération média (images/vidéo IA)                       | ❌ absent                         | **Aucun provider** installé/référencé (ni higgsfield, replicate, openai, fal, runway…). Pas d'`axios`/`node-fetch` (Node 22 → `fetch` natif).                                     |
| Planification média / stratégie / QA / cost / continuité | ❌ absent                         | C'est le cœur de ce que 0.2 ajoute.                                                                                                                                               |
| Scènes de démo                                           | ⚠️ primitives                     | `product-reveal` = primitive orbitable (le risque « low-poly » que le mandat interdit comme output premium final).                                                                |

## 1. Décision d'architecture : ADDITIF, pas monorepo

Le mandat cite une cible `packages/ace-media-*`. Or ce dépôt n'est **pas** un
monorepo. Convertir en monorepo serait une refonte destructrice (déplacer tout
`src/ace/*`, réécrire tsconfig/paths/tests/générateur/élagage). Le mandat
autorise explicitement l'alternative additive propre.

**Décision** : la couche Creative Media Engine vit sous `src/ace/media-engine/`
(logique moteur, importable via l'alias `@/ace/media-engine`) et
`scripts/ace/media/` (CLI Node). Les « packages » de la cible deviennent des
**sous-modules** :

| Cible mandat                          | Réalisation additive                                                               |
| ------------------------------------- | ---------------------------------------------------------------------------------- |
| `ace-media-types`                     | `src/ace/media-engine/types.ts`                                                    |
| `ace-media-core`                      | `src/ace/media-engine/{plan,strategy,anti-low-poly}.ts`                            |
| `ace-media-providers`                 | `src/ace/media-engine/providers/{registry,types,local,higgsfield}.ts`              |
| `ace-media-qa`                        | `src/ace/media-engine/qa.ts` (+ continuity)                                        |
| `ace-media-scroll`                    | orchestration au-dessus de l'existant : `src/components/media/CinematicScroll.tsx` |
| `ace-media-config`                    | `src/ace/media-engine/config.ts` (lecture `process.env`, jamais `.env`)            |
| `ace-storyboard` / `ace-shot-planner` | `src/ace/media-engine/shot-planner.ts`                                             |
| `ace-media-cli`                       | `scripts/ace/media/*.mjs`                                                          |
| `tooling/media`, `ffmpeg`             | déjà : `scripts/assets/*` + adapter local                                          |

Le générateur `new-site.mjs` élaguera l'outillage média interne (CLI, docs
internes) des sites clients, comme il élague déjà scripts/ace et les docs
moteur — la couche runtime réutilisable (composants, orchestration scroll)
reste, elle, expédiable.

## 2. Modules à créer (Phase 2 → 5)

### 2.1 Types (`src/ace/media-engine/types.ts`)

`AceMediaIntent`, `AceMediaStrategy`, `AceQualityBar`, `AceShotPlan`,
`AceMediaPlan`, `AceProviderResult`, `AceMediaQaReport`, `AceContinuityReport`,
`AceCostEstimate`, `AceCapabilityReport`. Tous typés, sérialisables.

### 2.2 Strategy decision layer (`strategy.ts`)

Fonction pure `chooseStrategy(intent, constraints, availableAssets, providers)`
→ une des stratégies (webgl / video-scroll / image-sequence / 2.5d / hybrid /
editorial-fallback) + justification + prérequis. **C'est ici que la règle
anti-low-poly vit** : un besoin photoréaliste sans média ni provider ne renvoie
JAMAIS « webgl primitive » ; il renvoie `MEDIA_ASSET_REQUIRED` ou un fallback
éditorial premium explicite.

### 2.3 Media plan + shot planner (`plan.ts`, `shot-planner.ts`)

`buildMediaPlan(brief)` et `buildShotPlan(plan)` : structures typées
(rôle narratif, start/end state, caméra, composition, durée, refs amont/aval,
validation attendue). Pures, testables.

### 2.4 Cost guard (`cost.ts`)

`estimateCost(plan, providerPricing)` → coût min/recommandé/prudent + seuil
d'alerte. Refuse une génération massive au-dessus d'un seuil sans confirmation.
Les tarifs providers sont des **données de config**, pas des chiffres inventés.

### 2.5 QA + continuity (`qa.ts`, `continuity.ts`)

`assessMedia(...)` et `assessContinuity(shotA, shotB)` : détectent/signalent les
dérives (structure change, artefacts, raccord raté, rendu trop IA, plan
invendable). Scoring interne (continuité/réalisme/narration/intégrabilité/
valeur). Le moteur peut **rejeter** un plan sous un seuil. Note d'honnêteté : la
QA visuelle 100 % automatique d'un rendu IA n'est pas résoluble sans modèle de
vision ; cette couche fournit des **heuristiques + un cadre de revue humaine
structuré**, pas un juge parfait — documenté comme tel.

### 2.6 Anti-low-poly guard (`anti-low-poly.ts`)

`assertNoLowPolySubstitution(intent, strategy, assets)` : lève/signale si une
intention premium retombe sur une substitution procédurale cheap. Utilisé par
la strategy layer et testé.

### 2.7 Provider layer (`providers/`)

- `types.ts` : contrat `MediaProvider` (capabilities, isConfigured, generate…).
- `registry.ts` : enregistrement pluggable, fail-safe si un provider manque.
- `local.ts` : **adapter RÉEL** ffmpeg/sharp (assemble vidéo, extrait frames,
  optimise, poster) — tourne vraiment ici.
- `higgsfield.ts` : **adapter GUARDÉ**. Sans credentials → `PROVIDER_NOT_CONFIGURED`.
  Jamais simulé. L'appel réseau réel est encapsulé mais non exécuté tant que la
  config n'est pas présente ; le format exact de l'API Higgsfield n'étant pas
  vérifiable ici, l'adapter est documenté comme **à finaliser/valider contre la
  vraie API** (stub honnête d'intégration, pas un faux succès).

### 2.8 Config (`config.ts`)

Lit `process.env.HIGGSFIELD_API_KEY` / `_BASE_URL` etc. **Ne lit jamais** les
fichiers `.env` (gitignorés, sensibles). Expose `isProviderConfigured(name)`.

### 2.9 Scroll cinema orchestration (`src/components/media/CinematicScroll.tsx`)

Wrapper générique au-dessus de l'EXISTANT (ScrollVideo / ScrollImageSequence /
DepthParallax / MediaFallback) : choisit le mode selon une stratégie + gère
reduced-motion, mobile, fallback, overlays chapitres. Générique (pas SCMC).

### 2.10 CLI (`scripts/ace/media/*.mjs`)

`capabilities`, `plan`, `qa`, `cost`, `frames`, `assemble`, `optimize`,
`report`, `provider-check`. Non destructifs, sorties lisibles, erreurs claires.

## 3. Risques & décisions honnêtes

- **QA visuelle IA** : non résoluble automatiquement sans modèle de vision →
  heuristiques + cadre de revue, jamais un « ✓ vendable » automatique mensonger.
- **Higgsfield** : API non vérifiable dans cet environnement → adapter guardé +
  doc setup ; aucun faux succès. `PROVIDER_NOT_CONFIGURED` par défaut.
- **Cost** : les tarifs sont de la config utilisateur, jamais inventés.
- **Anti-refonte** : additif sous `src/ace/media-engine`, zéro déplacement des
  modules existants, `pnpm check` doit rester vert à chaque incrément.

## 4. Definition of done (0.2)

Types + strategy + cost + QA + anti-low-poly + provider layer (local réel +
higgsfield guardé) + orchestration scroll + CLI + docs, avec tests, `pnpm check`
vert, aucun secret, aucun faux succès provider, et un rapport final honnête
listant réel / stub / dépendant-externe.

## 5. État d'avancement (mis à jour)

> Addendum de suivi. Les sections 1–4 ci-dessus sont le plan d'origine ; ce qui
> suit est l'état RÉEL après implémentation (le plan reste l'historique fidèle).

| Phase                                                           | État        | Notes de réconciliation vs plan                                                                                                                                                                                                 |
| --------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 — audit réel                                                  | ✅          | ffmpeg/sharp/gltf présents ; aucun provider IA ; runtime scroll-cinéma existant.                                                                                                                                                |
| 1 — plan                                                        | ✅          | ce document.                                                                                                                                                                                                                    |
| 2 — fondations (types, strategy, shot, cost, qa, anti-low-poly) | ✅          | La continuité vit dans `qa.ts` (`assessContinuity`), **pas** dans un `continuity.ts` séparé. Le contrat de résultat provider s'appelle `ProviderResult` (`providers/types.ts`), pas `AceProviderResult`.                        |
| 3 — provider layer (local + higgsfield + registry + config)     | ✅          | `local` = traitement réel (ffmpeg) ; `higgsfield` guardé, jamais simulé (schéma réponse **À CONFIRMER**).                                                                                                                       |
| 4 — scroll cinema (`CinematicScroll`)                           | ✅          | Orchestre `video-scroll`/`image-sequence` ; autres stratégies → poster (jamais de 3D cheap). `DepthParallax` n'est pas monté par ce wrapper (repli poster).                                                                     |
| 5 — CLI                                                         | ⚠️ partiel  | Livrés : `capabilities`, `plan`, `frames`, `report`, `provider:check`. **Non livrés** : `generate`, `qa`, `cost`, `assemble`, `optimize` (logique QA/coût existe en module, sans wrapper CLI). À implémenter, jamais à simuler. |
| 6 — docs                                                        | ✅          | `ACE-MEDIA-ARCHITECTURE`, `ACE-PROVIDER-INTEGRATION`, `ACE-HIGGSFIELD-SETUP`, `ACE-SCROLL-CINEMA`, `ACE-COST-GUARD`, `ACE-MEDIA-QA`, `ACE-ANTI-LOW-POLY`, `ACE-PUBLIC-RELEASE`.                                                 |
| 7 — élagage générateur + validation + rapport honnête           | ⏳ en cours | Voir `ACE-PUBLIC-RELEASE.md` pour la matrice shippé/élagué.                                                                                                                                                                     |

**Écarts assumés** (honnêteté) : la génération IA n'est pas fonctionnelle par
défaut (provider requis, mapping Higgsfield à confirmer) ; les CLI
`generate/qa/assemble/optimize` ne sont pas fournies dans cette itération.

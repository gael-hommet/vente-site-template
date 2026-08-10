# ACE — Changelog

Document **interne au moteur** (élagué à la génération). Versions de la couche
moteur (`src/ace/core/version.ts`), pas de l'application.

## 0.2.2 — Free Media Autopilot (coût média 0 €)

**Correction de paradigme.** La 0.2.1 supposait qu'ACE devait _générer_ ses
visuels via un service payant. C'était une erreur d'interprétation : ACE doit
produire des sites **gratuitement**, à partir des **vrais** médias disponibles.

### Retiré

Tout le paradigme de génération distante : adapter Higgsfield, pilote `hf-api`,
`provider-runtime`, registre de providers, model router, cost guard (`cost.ts`,
`budget.ts`), orchestrateur de génération, `ace:media:generate`,
`ace:provider:check`, et les docs associées (Higgsfield, provider integration,
cost guard, admin setup). **Aucun code mort conservé.**

Disparaissent aussi du workflow : l'état `MEDIA_GENERATION`, l'état
`WAITING_FOR_APPROVAL`, les blocages `ADMIN_PROVIDER_AUTH_REQUIRED` et
`SPEND_APPROVAL_REQUIRED`, et tout seuil de dépense.

### Ajouté

- **Asset Source Policy** (`asset-source.ts`) — hiérarchie obligatoire
  CLIENT_PROVIDED → OFFICIAL_WEBSITE → OFFICIAL_SOCIAL →
  OTHER_VERIFIED_OFFICIAL → USER_SUPPLIED_GENERATED → EDITORIAL_FALLBACK, avec
  provenance, nature (`REAL`/`CONCEPTUAL`) et droits pour chaque média.
- **PRIVATE_DEMO vs PRODUCTION** — la démo privée exploite les médias officiels
  publics (provenance conservée, mention explicite, noindex) ; la production
  exige des droits confirmés et les liste sinon.
- **Nouveaux états** : `ASSET_DISCOVERY` (chercher d'abord, demander ensuite) et
  `ASSET_VALIDATION` ; `MEDIA_PROCESSING` remplace la génération.
- **La direction artistique vient APRÈS l'analyse des visuels réels.**
- **SITE_BUILD est une vraie étape** : génère, écrit le contenu, câble les
  visuels PAR RÔLE, puis vérifie 11 points (pages, navigation, CTA, formulaire,
  SEO, sitemap/robots, noindex en démo, visuels réellement référencés).
- **MOBILE_QA est une vraie étape** : capture mobile réelle obligatoire +
  mesures (débordement horizontal, images chargées, lisibilité, h1 unique,
  taille du CTA). Un échec mobile empêche `COMPLETE`.
- `ace:doctor` renvoie **`ACE READY`** sans aucun service tiers.

### Corrigé

- Le **logo servait de fond de hero** : les visuels sont désormais câblés par
  RÔLE (`hero`, `gallery`…), jamais par ordre de fichier.
- Un **fait vérifié prime** sur le nom extrait de la phrase de départ.
- La sonde mobile mesurait des éléments **masqués** (CTA à 0 px) : elle ne
  considère plus que les éléments visibles.

## 0.2.1 — ACE AUTOPILOT (une phrase suffit)

Complète la promesse de 0.2 : « moteur média + orchestration provider +
**autonomie utilisateur de haut niveau** ». Pas de bump majeur — Autopilot est
ce que 0.2 était censé signifier ; le contrat des sites GÉNÉRÉS ne change pas
(Autopilot est élagué), d'où un incrément de patch.

### Ajouté

- **`src/ace/autopilot/`** — machine à états persistante (16 états), détection
  d'intention en langage naturel, garde-fous, direction artistique autonome,
  rapports à deux niveaux.
- **`pnpm ace:doctor`** — « ACE READY » / « ACE NEEDS ADMIN SETUP », séparation
  essentiel / optionnel, aucune valeur de credential affichée.
- **`pnpm ace:autopilot`** / **`pnpm ace:resume`** — point d'entrée unique.
  Codes de sortie : 0 avancé · 3 besoin de l'agent · 4 bloqué · 5 accord attendu.
- **`src/config/ace-autopilot-policy.ts`** — seuils de dépense, itérations
  visuelles, et les deux listes explicites autorisé / interdit.
- **État CONTENT** — les faits vérifiés deviennent de vrais textes écrits dans
  `site-content.ts` ; les visuels fournis par le client sont câblés dans le hero
  et la collection.
- **Docs** — `ACE-AUTOPILOT.md` (parcours) et `ACE-ADMIN-SETUP.md` (opération
  administrateur unique). README réécrit pour trois publics.
- **CLAUDE.md** — section ACE OPERATOR MODE : une session Claude sans historique
  sait quoi faire dès la première phrase de l'utilisateur.

### Corrigé

- Les profils sectoriels proposaient des recipes d'une **autre famille**
  (`hero: "editorial"` n'existe pas) : la génération échouait. Corrigé, et un
  test verrouille désormais chaque famille contre le catalogue réel.
- Le **quality gate n'était pas branché** : un site noté 0.6 passait `COMPLETE`.
  Il déclenche maintenant une nouvelle passe, puis `QUALITY_NOT_REACHED`.
- Les visuels du client étaient copiés mais **jamais affichés**.
- `PREVIEW` affirmait une URL sans l'avoir vérifiée : elle n'est annoncée que si
  un serveur répond réellement.

### Sécurité public-ready

- L'identité d'un client réel présente dans 10 documents moteur et une empreinte
  anti-template est **anonymisée** (« Site témoin A »), sans détruire la preuve :
  la comparaison anti-template rend le même verdict et ses tests passent.
- Le cerveau Autopilot, sa politique de dépense, ses fixtures et `.ace/` ne
  partent **jamais** dans un site client (test de régression).

## 0.2.0 — Creative Media Autonomous Engine

Passage d'un moteur qui _intègre_ de beaux médias à un moteur qui **décide,
planifie, route, génère, contrôle, itère, assemble et intègre**.

### Ajouté

- **Provider officiel** — adapter Higgsfield bâti sur le CLI officiel `hf-api`
  (`@higgsfield/cloud-cli`), conçu pour être piloté par un agent autonome.
  Contrat capturé en exécutant le binaire : `auth`, `models`, `estimate`,
  `generate`, `status`, `wait`, `usage`, flag `--json`.
- **Model router** (`model-router.ts`) — route uniquement dans le catalogue RÉEL
  du provider ; `CATALOG_UNAVAILABLE` / `NO_MATCHING_MODEL` sinon.
- **Reference lock** (`reference-lock.ts`) — verrou d'identité du sujet ; le plan
  N approuvé devient la référence forte du plan N+1.
- **Orchestrateur** (`orchestrator.ts`) — boucle PLAN → MODEL → COST → GENERATE →
  QA → ART → GATE → ACCEPT/REJECT → RETRY borné, avec **ports injectés** (donc
  prouvable sans provider payant).
- **QA technique réelle** (`node/technical-qa.ts`) — ffprobe : dimensions, durée,
  fps, codec, corruption, poids, audio.
- **Continuité v2** (`node/continuity.ts`) — frames de raccord extraites, SSIM +
  écart de couleur moyenne, sur de VRAIS fichiers.
- **Premium output gate** (`premium-gate.ts`) — extension de l'anti-low-poly à
  toutes les formes de médiocrité (placeholder, asset de test, média corrompu,
  verrou rompu, repli silencieux).
- **Art direction** (`art-direction.ts`) — « techniquement valide mais
  visuellement insuffisant → REJECT ».
- **Budget réel** (`budget.ts`) — dépense consommée, plafond, arrêt net.
- **Manifeste de provenance** (`manifest.ts`) — modèle, mode, promptHash,
  références, tentatives, verdicts.
- **Mode de diffusion** (`delivery-mode.ts`) — arbitrage chiffré video-scroll vs
  image-sequence.
- **CLI** : `ace:media:generate`, `ace:media:qa`, `ace:media:assemble`,
  `ace:media:optimize` (en plus de `capabilities`, `plan`, `frames`, `report`,
  `provider:check`).
- **Scroll Cinema v2** — calque poster anti-flash-noir, chapitres réellement
  synchronisés à la progression (`aria-current`), sources mobiles dédiées.

### Corrigé

- **Endpoint REST inventé supprimé.** L'adapter appelait
  `https://api.higgsfield.ai/v1/generations`, un contrat jamais vérifié : l'audit
  a mesuré **HTTP 521** (origine injoignable). Remplacé par le CLI officiel.
- **`optimize` upscalait** un master 1280 px vers 1920 px (+71 % de poids pour
  zéro information). La largeur est désormais plafonnée à la source, et le refus
  est signalé.
- **Seuils de continuité recalibrés sur des mesures réelles.** Le SSIM absolu
  s'est révélé non fiable (deux images sans rapport : 0.155 dans un cas, 0.657
  dans l'autre) : ACE croise désormais deux signaux et ne conclut jamais sur le
  SSIM seul.

### Statuts honnêtes ajoutés

`PROVIDER_AUTH_PENDING` · `PROVIDER_CONTRACT_UNVERIFIED` ·
`HF_SCHEMA_UNVERIFIED` · `CATALOG_UNAVAILABLE` · `NO_MATCHING_MODEL`

### Non livré (assumé)

- La **génération IA n'a jamais été exécutée réellement** : aucun credential
  disponible dans cet environnement (`PROVIDER_AUTH_PENDING`). Le chemin est
  codé et refuse proprement ; il n'est pas _validé de bout en bout_.
- Le **schéma JSON des réponses** du provider reste à confirmer à la première
  authentification (extracteurs tolérants + `HF_SCHEMA_UNVERIFIED`).
- La **QA visuelle** (déformations, artefacts, « trop IA ») n'est pas
  automatisée : `REVIEW_REQUIRED` est une sortie valide.

## 0.1.0 — Fondations

Couche moteur `src/ace/` (Option B) : identité, Design Language configurable,
registres (UI, motion, scenes, media, content, SEO, forms, analytics, testing),
générateur `ace:new-site`, validation anti-template.

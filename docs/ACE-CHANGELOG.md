# ACE — Changelog

Document **interne au moteur** (élagué à la génération). Versions de la couche
moteur (`src/ace/core/version.ts`), pas de l'application.

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

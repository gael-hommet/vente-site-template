# ACE 0.2 — Rapport final honnête (Creative Media Autonomous Engine)

Document **interne au moteur** (élagué à la génération). Rapport de clôture de la
couche média ACE 0.2. **Sans complaisance** : ce qui est réel, ce qui est
stub/à-configurer, ce qui dépend d'un provider ou d'un asset externe.

> Règle d'or de ce rapport : **ne rien surévaluer**. Une capacité n'est
> « fonctionne » que si elle a été exécutée et vérifiée ici.

## 1. Ce qui a été réellement créé

| Livrable                                              | Fichiers                                                                                                                               | État                                |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| Contrats typés                                        | `src/ace/media-engine/types.ts`                                                                                                        | ✅ réel, sérialisable               |
| Doctrine anti-low-poly (garde + verdict)              | `anti-low-poly.ts`                                                                                                                     | ✅ réel, **testé**                  |
| Strategy decision layer (pure)                        | `strategy.ts`                                                                                                                          | ✅ réel, **testé**                  |
| Shot planner (storyboard + raccords)                  | `shot-planner.ts`                                                                                                                      | ✅ réel, **testé**                  |
| Media plan builder                                    | `plan.ts`                                                                                                                              | ✅ réel, **testé**                  |
| Cost guard                                            | `cost.ts`                                                                                                                              | ✅ réel, **testé**                  |
| QA + continuité (cadre + heuristiques)                | `qa.ts`                                                                                                                                | ✅ réel, **testé**                  |
| Config providers (ENV only)                           | `config.ts`                                                                                                                            | ✅ réel                             |
| Contrat + registre de providers                       | `providers/{types,registry}.ts`                                                                                                        | ✅ réel, fail-safe                  |
| Adapter local (ffmpeg/sharp)                          | `providers/local.ts`                                                                                                                   | ✅ réel (statut injecté par la CLI) |
| Adapter Higgsfield (guardé)                           | `providers/higgsfield.ts`                                                                                                              | ⚠️ **stub honnête** (voir §3)       |
| Runtime scroll-cinéma                                 | `src/components/media/CinematicScroll.tsx`                                                                                             | ✅ réel, **testé**                  |
| CLI capabilities/plan/frames/report/provider-check    | `scripts/ace/media/*`, `provider-check.mjs`                                                                                            | ✅ réel, **exécuté**                |
| Docs (8)                                              | `docs/ACE-MEDIA-*`, `ACE-PROVIDER-*`, `ACE-HIGGSFIELD-*`, `ACE-COST-*`, `ACE-ANTI-LOW-POLY`, `ACE-SCROLL-CINEMA`, `ACE-PUBLIC-RELEASE` | ✅ réel                             |
| Élagage générateur (runtime shippé, outillage élagué) | `scripts/ace/new-site.mjs`                                                                                                             | ✅ réel, **testé end-to-end**       |

Volume : ~1240 lignes de logique média + 133 lignes de runtime + 325 lignes de
tests. 4 commits (`cd0aeef`, `72a6cd2`, `c4e4b68`, `36e651e`).

## 2. Ce qui FONCTIONNE ici, maintenant (vérifié)

- **Décision de stratégie** : `chooseStrategy` mappe intention+assets+providers+
  contraintes → stratégie + blocker honnête. Exécuté via `pnpm ace:media:plan`.
- **Doctrine anti-low-poly** : un besoin photoréaliste sans asset ni provider
  renvoie `editorial-fallback` + `PROVIDER_NOT_CONFIGURED` avec la mention « ACE
  ne bricole PAS de low-poly ». **Prouvé** par `ace:media:plan --demo` (exit 1) et
  par les tests unitaires (WebGL+photoreal+sans modèle 3D → exception).
- **Traitement local réel** : `pnpm ace:media:frames` extrait de vraies frames
  webp via ffmpeg (ffmpeg 7.1.5 présent). Non destructif.
- **Audit honnête de l'environnement** : `pnpm ace:media:capabilities` /
  `ace:media:report` reflètent l'état RÉEL (ffmpeg/sharp/gltf ✓, aucun provider ✗).
- **Statut providers** : `pnpm ace:provider:check` → `PROVIDER_NOT_CONFIGURED`,
  exit 3, sans jamais afficher de valeur de credential.
- **Runtime scroll-cinéma** : `CinematicScroll` orchestre video-scroll/
  image-sequence, honore reduced-motion (poster), garde le CTA atteignable, ne
  monte jamais de 3D cheap. Testé.
- **Élagage générateur** : un site client généré ne contient ni CLI média, ni
  docs média, ni tests de doctrine, ni script `ace:*` cassé — mais **garde** le
  runtime média réutilisable. Vérifié en générant un site (47 entrées élaguées).
- **`pnpm check`** vert : lint + typecheck + **205 tests** + build.

## 3. Ce qui est STUB / à CONFIGURER (honnêteté)

- **Génération IA (Higgsfield)** : l'adapter est codé, guardé et testé, mais **le
  contrat exact de l'API n'est PAS validé** (aucune credential, aucun accès réseau
  vérifié ici). Tant que le schéma payload/réponse n'est pas confirmé,
  `generate()` renvoie `GENERATION_FAILED` explicite — **jamais** un faux succès.
  Voir [ACE-HIGGSFIELD-SETUP.md](ACE-HIGGSFIELD-SETUP.md). Aucune image/vidéo ne
  peut être générée par défaut.
- **CLI `generate` / `qa` / `assemble` / `optimize`** : **non fournies** comme
  scripts dans cette itération. La logique QA (`qa.ts`) et l'assemblage local
  (`frames.mjs` + provider `local`) existent, mais sans wrapper CLI dédié. À
  implémenter, jamais à simuler.
- **QA visuelle IA** : non automatisable ici sans modèle de vision. `qa.ts`
  fournit un cadre de scoring + des heuristiques structurelles ; chaque rapport
  porte `requiresHumanReview: true`. Aucun « ✓ vendable » automatique.

## 4. Ce qui dépend d'un PROVIDER ou d'un ASSET externe

- **Générer** une image/vidéo IA : requiert un provider configuré ET son contrat
  d'API validé.
- **Stratégie `hybrid`** (génération → assemblage) : requiert un provider ; sinon
  la décision retombe honnêtement sur `editorial-fallback` + blocker.
- **Stratégies `video-scroll` / `image-sequence` / `2.5d` / `webgl`** : requièrent
  l'**asset** correspondant (vidéo continue, séquence de frames, images+depth,
  vrai modèle glTF). Sans asset ni provider pour un besoin premium → blocker
  `MEDIA_ASSET_REQUIRED` / `PROVIDER_NOT_CONFIGURED`, jamais de dégradation cheap.
- **Coûts** : chiffrés uniquement si un `AceProviderPricing` (tarif + source) est
  fourni ; sinon `0` + note « non chiffré ».

## 5. Sécurité & public-ready (vérifié)

- **Aucun secret** en dur dans la couche média (scan `sk-`/`AKIA`/clé privée : 0).
- **Aucune lecture de fichier `.env`** : uniquement `process.env`, confiné aux
  variables `HIGGSFIELD_*` déclarées. Aucune valeur de credential loguée.
- **Aucune identité client en dur** (IN QUARTO / autre) dans la couche média.
- **IN QUARTO figé** : dépôt vérifié **0 modification** — intact.
- **Aucun push / déploiement / publication** : la couche média n'ajoute aucun
  hook de ce type.

## 6. Écarts assumés vs mandat

- **Emplacement** : mandat = `packages/ace-media-*` ; dépôt = mono-package. Choix
  **additif** `src/ace/media-engine/` documenté — un refactor monorepo aurait été
  destructeur (le mandat interdisait la refonte). Voir
  [ACE-0.2-IMPLEMENTATION-PLAN.md](ACE-0.2-IMPLEMENTATION-PLAN.md).
- **CLI partielle** : 5 commandes réelles livrées sur les ~10 évoquées ; les 4
  manquantes (generate/qa/assemble/optimize) sont documentées comme non fournies,
  pas simulées.
- **Génération non fonctionnelle par défaut** : par honnêteté (schéma Higgsfield à
  confirmer), pas par oubli.

## 7. Prochaine passe recommandée

1. Valider le contrat API Higgsfield (ou un provider équivalent) et finaliser le
   mapping réponse → `outputs`.
2. Ajouter les CLI `generate` (via provider), `qa` (wrapper de `qa.ts`),
   `assemble`/`optimize` (via provider `local` réel).
3. Brancher un tarif réel dans le cost guard pour des estimations chiffrées.
4. Étendre `CinematicScroll` (ou une surface dédiée) au montage 2.5D quand des
   depth maps sont fournies.

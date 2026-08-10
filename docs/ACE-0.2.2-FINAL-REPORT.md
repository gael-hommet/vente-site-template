# ACE 0.2.2 — Free Media Autopilot · rapport final

Document **interne au moteur** (élagué à la génération). Règle : rien n'est
déclaré fonctionnel sans avoir été **exécuté ici**.

## 1. Ancien workflow (0.2.1)

```
INTAKE → RESEARCH → FACT_CHECK → SITE_BOOTSTRAP → ART_DIRECTION → CONTENT
       → MEDIA_PLAN → MEDIA_GENERATION → MEDIA_QA → SITE_BUILD
       → VISUAL_QA → MOBILE_QA → TECHNICAL_QA → PREVIEW → COMPLETE
```

Il supposait qu'à défaut de média, ACE devait **générer** des visuels via un
service payant (Higgsfield). Sans clé, il bloquait en
`ADMIN_PROVIDER_AUTH_REQUIRED` et `ace:doctor` affichait
`ACE NEEDS ADMIN SETUP`. `SITE_BUILD` et `MOBILE_QA` n'étaient que des jalons.

## 2. Nouveau workflow (0.2.2)

```
INTAKE → RESEARCH → FACT_CHECK → ASSET_DISCOVERY → ASSET_VALIDATION
       → ART_DIRECTION → CONTENT → MEDIA_PLAN → MEDIA_PROCESSING
       → SITE_BUILD → VISUAL_QA → MOBILE_QA → TECHNICAL_QA → PREVIEW → COMPLETE
```

La direction artistique vient **après** l'analyse des vrais visuels. États
terminaux : `COMPLETE` · `BLOCKED`. **Coût média : 0 €.**

## 3. Retiré du paradigme Higgsfield / provider

Supprimés (aucun code mort conservé) :
`providers/higgsfield.ts` · `providers/local.ts` · `providers/registry.ts` ·
`providers/types.ts` · `node/hf-cli.ts` · `node/provider-runtime.ts` ·
`model-router.ts` · `orchestrator.ts` · `budget.ts` · `cost.ts` · `config.ts` ·
`scripts/ace/media/generate.ts` · `scripts/ace/media/provider-check.mjs` ·
`tests/unit/media-orchestrator.test.ts` · docs Higgsfield / provider-integration
/ cost-guard / admin-setup.

Disparus du modèle : l'état `MEDIA_GENERATION`, l'état `WAITING_FOR_APPROVAL`,
les blocages `ADMIN_PROVIDER_AUTH_REQUIRED` et `SPEND_APPROVAL_REQUIRED`, la
commande `ace:autopilot approve`, et **tout seuil de dépense**.

## 4. Ce qui reste en expert / legacy

**Rien de « legacy désactivé »** — la simplicité a été préférée. Restent, parce
qu'ils servent réellement : `ace:media:{capabilities,plan,qa,assemble,optimize,
frames,report}`, le media-engine (stratégie, anti-low-poly, premium gate, QA
ffprobe, continuité, delivery-mode, reference-lock, manifeste), ffmpeg/ffprobe/
sharp/gltf, ScrollVideo, CinematicScroll, 2.5D, WebGL.

## 5. Doctor

```
ACE READY            (exit 0)
✓ Node ✓ pnpm ✓ dépendances ✓ git ✓ écriture ✓ ffmpeg ✓ ffprobe ✓ sharp
✓ @gltf-transform ✓ navigateur ✓ disque ✓ port 3000
```

Aucune ligne « provider ». Un test vérifie que le fichier ne contient plus ni
`higgsfield`, ni `hf-api`, ni `ACE NEEDS ADMIN SETUP`.

## 6. Pipeline « assets officiels »

`ASSET_DISCOVERY` impose **CHERCHER D'ABORD** (site officiel, réseaux officiels,
sources publiques) et n'autorise une question à l'utilisateur que si la recherche
est vide. `ASSET_VALIDATION` refuse tout média sans provenance, écarte les médias
conceptuels utilisés comme réalisations, et bloque la production si des droits ne
sont pas confirmés. Les fichiers sont importés dans `public/assets/client/`,
optimisés (`MEDIA_PROCESSING`), puis câblés **par rôle**.

## 7. Pipeline « asset fourni par l'utilisateur »

Une image créée ailleurs (ChatGPT, Midjourney…) est un asset comme un autre :
type `USER_SUPPLIED_GENERATED`. ACE l'optimise, la cadre, l'anime et l'intègre —
il n'essaie **jamais** de la régénérer, et conserve la distinction
concept / réalisation réelle.

## 8. SITE_BUILD réel

Vérifié sur la mission d'acceptation — 11 contrôles, tous verts :

```
✓ page d'accueil   ✓ page contact   ✓ mentions légales
✓ contenu éditorial écrit           ✓ navigation définie      ✓ CTA principal
✓ formulaire de contact             ✓ métadonnées SEO         ✓ sitemap + robots
✓ noindex (démo privée)             ✓ visuels réellement référencés (7)
```

## 9. MOBILE_QA réel

Capture mobile **obligatoire** (Playwright, viewport iPhone 13), puis mesures
réelles dans la page :

```
✓ aucun débordement horizontal
✓ images chargées (1 image, 0 cassée)
✓ texte lisible (16 px)
✓ un seul h1
✓ CTA présent
✓ CTA assez grand pour le pouce (48 px)
```

Un échec mobile **empêche `COMPLETE`** (blocage `QUALITY_NOT_REACHED` avec la
liste des points en défaut).

## 10. Boucle visuelle

Conservée, et elle a **encore servi** pendant cette session : la première capture
montrait le **logo** en fond de hero. Correction (câblage par rôle), recapture :
la photo `role: "hero"` est utilisée avec son alt réel, et la galerie prend des
photos distinctes. Un score n'est jamais fourni sans capture réellement examinée.

## 11. Tests

**254 tests** au vert (27 fichiers), lint et typecheck sans avertissement, build
OK. Couverture des points A→L du mandat dans `tests/unit/autopilot.test.ts` :

| Point | Vérifié                                                                       |
| ----- | ----------------------------------------------------------------------------- |
| A     | `ace:doctor` ne mentionne plus aucun service de génération                    |
| B/C   | visuels officiels **ou** fournis ⇒ aucun blocage                              |
| D/E/F | sans visuel ⇒ `MEDIA_ASSET_REQUIRED` ; ni provider, ni dépense dans la policy |
| G     | site généré sans cerveau Autopilot ni outillage moteur                        |
| H     | démo privée : provenance conservée + mention affichée                         |
| I     | production : droits non confirmés ⇒ blocage                                   |
| J/K   | `doSiteBuild` et `doMobileQa` existent et travaillent réellement              |
| L     | aucune substitution low-poly                                                  |

Plus : hiérarchie des sources respectée, média conceptuel refusé comme
réalisation, absence de `MEDIA_GENERATION` / `WAITING_FOR_APPROVAL`.

## 12. Test d'acceptation

Fixture **Maison Verrier** (entreprise fictive) : « site officiel » avec logo,
5 photos et 1 vidéo. Prompt unique :

> Fais leur un site ultra premium : https://maison-verrier.test

Résultat, sans aucune génération ni coût :

| Étape               | Résultat                                                     |
| ------------------- | ------------------------------------------------------------ |
| Sources identifiées | 7 médias, provenance `OFFICIAL_WEBSITE` / `OFFICIAL_SOCIAL`  |
| Import              | copiés dans `public/assets/client/`                          |
| Validation          | 0 erreur ; démo privée ⇒ droits publics tolérés              |
| DA                  | décidée **après** analyse ; hero porté par l'image           |
| Site                | `/workspaces/maison-verrier`, nom issu d'un **fait vérifié** |
| Visuels utilisés    | hero = photo `role: hero` ; galerie = photos distinctes      |
| Desktop / mobile    | captures réelles ; mobile mesuré (6 contrôles verts)         |
| QA technique        | lint ✓ typecheck ✓ test ✓ build ✓ dans le site généré        |
| Preview             | `HTTP 200`                                                   |
| Rapport             | utilisateur sans jargon + technique                          |

## 13. Version

`0.2.1` → **`0.2.2`**. Patch : correction de paradigme, aucun élargissement du
contrat des sites générés.

## 14. Commits

| Commit    | Contenu                                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------------------------- |
| `6c439f1` | Suppression du paradigme provider, Asset Source Policy, nouveau workflow, SITE_BUILD/MOBILE_QA réels, docs, version 0.2.2 |
| `714ce86` | Purge des dernières traces provider dans `ace:media:capabilities` et `ace:media:report`                                   |

## 15. État git

Branche `main`, arbre **propre**. **Aucun push, aucun déploiement.**

---

## Ce qui n'est PAS prouvé

1. **Recherche web réelle** : l'acceptation utilise une fixture locale explicite.
   La découverte sur un vrai site public dépend de l'agent, pas du script.
2. **Rendu « ultra premium »** : les visuels de la fixture sont des mires ffmpeg.
   La mise en page est correcte ; le rendu final avec de vraies photos reste à
   évaluer.
3. **Téléchargement d'assets distants** : les fixtures sont locales ; l'import
   depuis une URL officielle réelle n'a pas été exercé.
4. **`MEDIA_PROCESSING`** appelle `assets:images` et n'échoue pas si le pipeline
   est indisponible : l'optimisation est alors signalée comme ignorée.
5. **Score visuel** : fourni par l'agent qui regarde les captures. Aucun modèle
   de vision n'est branché dans le pipeline.

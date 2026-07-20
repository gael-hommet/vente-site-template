# ACE — Contrat de génération

Ce document décrit le contrat d'entrée/sortie de `pnpm ace:new-site`, le
générateur config-aware d'ACE (Aurexia Cinematic Engine). Document **interne
au moteur** — jamais expédié dans un site client (voir la liste d'exclusion
dans `scripts/ace/new-site.mjs`).

## 1. Entrées

| Argument         | Obligatoire | Défaut                   | Rôle                                                                     |
| ---------------- | ----------- | ------------------------ | ------------------------------------------------------------------------ |
| `--name`         | oui         | —                        | Nom affiché du client.                                                   |
| `--out`          | oui         | —                        | Dossier cible (vide ou absent, sauf `--force`).                          |
| `--slug`         | non         | dérivé de `--name`       | Slug kebab-case (`package.json:name`, `ace.meta.json`).                  |
| `--config`       | non         | `input/client.config.ts` | Configuration client TypeScript.                                         |
| `--brief`        | non         | `input/CLIENT_BRIEF.md`  | Brief Markdown copié tel quel dans `input/`.                             |
| `--assets`       | non         | —                        | Dossier d'assets à copier + inventorier.                                 |
| `--url`          | non         | —                        | Origine absolue (canonical/OG/sitemap).                                  |
| `--force`        | non         | `false`                  | Écrase un dossier de sortie non vide.                                    |
| `--skip-install` | non         | `false`                  | N'exécute pas `pnpm install` dans le site généré.                        |
| `--skip-check`   | non         | `false`                  | N'exécute pas les quality gates (§ voir ACE-GENERATOR-QUALITY-GATES.md). |

### 1.1 Configuration client (`--config`)

Un fichier `.ts` avec un **export par défaut** de type `ClientConfigInput`
(voir `src/ace/config/client-schema.ts` — LA source de vérité unique du
schéma). Chargé et validé via `scripts/ace/load-client-config.ts` (exécuté par
`pnpm exec tsx`, qui résout `tsconfig.json#paths` nativement).

Le générateur ne duplique **jamais** le schéma Zod : toute évolution du
contrat se fait dans `src/ace/config/client-schema.ts` uniquement.

### 1.2 Brief (`--brief`)

Markdown libre, copié tel quel dans `input/CLIENT_BRIEF.md` du site généré.
Sert de mémoire humaine du brief d'origine — le générateur ne le parse pas.

### 1.3 Assets (`--assets`)

Dossier copié récursivement vers `public/assets/client/` du site généré, avec
un manifeste `public/assets/client/MANIFEST.json` (chemin source, chemin
généré, extension, taille, hash SHA-256 tronqué). Les originaux ne sont
**jamais modifiés**. Extensions dangereuses (`.exe`, `.sh`, `.bat`, …)
refusées ; extensions inattendues copiées mais signalées.

## 2. Pipeline de génération

1. **Validation** — charge + valide `--config` (schéma Zod, conflits de
   features, ids de recipes). Toute erreur bloque **avant** toute écriture
   sur disque de sortie.
2. **Export** — `git archive HEAD` + extraction (uniquement les fichiers
   suivis du moteur ; aucun état non commité, secret local ou cache ne peut
   fuiter).
3. **Élagage** — retire les routes Studio/Lab/Engine (`src/app/lab`,
   `src/app/ace-lab`, `src/app/engine`, composants associés) et les documents
   internes du moteur (`docs/audits`, roadmaps, plans…).
4. **Contrat d'entrée** — copie `--brief` et `--config` dans `input/` du site
   généré.
5. **Assets** — copie + manifeste (voir § 1.3).
6. **Identité & Design Language** — stamp `package.json:name`,
   `ace.meta.json`, `.env.local` (nom, preset, URL).
7. **Features résolues** — écrit `src/config/features.generated.ts`
   (`ResolvedFeatures` sérialisé) — consommé par le layout et les composants
   pour un effet **réel** (voir § 3).
8. **Configuration résolue** — écrit `src/config/client.resolved.json`
   (config Zod complète, défauts appliqués).
9. **Routes** — retire `src/app/realisations` si `features.collections` est
   inactif et qu'aucune page `standard: "collection"` n'est déclarée active.
10. **Mode proposition privée** — si `proposal.isPrivateProposal`, remplace
    `robots.ts` (disallow global) et `sitemap.ts` (liste vide).
11. **Anti-fuite** — recherche de secrets, fichiers interdits, routes internes
    résiduelles, identité d'un AUTRE client connu (jamais celle du client
    demandé).
12. **Rapport** — écrit `docs/ACE-GENERATION-REPORT.md` dans le site généré.
13. **Quality gates** — sauf `--skip-install`/`--skip-check` : install
    (lockfile figé), format, lint, typecheck, tests, build (voir
    ACE-GENERATOR-QUALITY-GATES.md).

## 3. Features → effet réel

Chaque flag résolu (`src/ace/config/features.ts`) a un effet vérifiable dans
le site généré, pas seulement un id inerte :

| Flag              | Effet quand `false`                                                                           |
| ----------------- | --------------------------------------------------------------------------------------------- |
| `webgl`           | dérivé de `webglIntensity` ; aucune scène R3F n'est activée par défaut.                       |
| `contactForm`     | (fondation conservée ; formulaire non mis en avant — voir § 4).                               |
| `collections`     | route `src/app/realisations` retirée du site généré, lien nav retiré.                         |
| `analytics`       | aucun provider analytics actif (`Analytics` reste un traqueur no-op).                         |
| `stickyMobileCta` | `<StickyMobileCTA>` non montée dans `layout.tsx` ; le padding mobile réservé disparaît aussi. |
| `darkMode`        | `<ThemeToggle>` non monté dans `SiteHeader` (aucun contrôle inutile).                         |
| `i18n`            | dérivé de `identity.locales.length > 1` ; aucune structure vide générée.                      |

## 4. Ce que le générateur NE détruit PAS aveuglément

Conformément au mandat : « ne pas détruire une fondation dont la suppression
rendrait les mises à jour futures dangereuses si une activation conditionnelle
propre suffit ». Concrètement :

- La route `/contact` et le formulaire restent présents même si
  `contactForm=false` — c'est un flag de mise en avant, pas de suppression
  physique (le formulaire lui-même n'a pas de bascule runtime dans ce starter ;
  une évolution future pourrait le rendre conditionnel sans casser l'upgrade path).
- Les modules moteur non utilisés (ex. `three`, `gsap`) restent dans
  `package.json` : ils sont déjà dynamiquement importés (`next/dynamic`,
  `ssr:false`) donc absents du bundle initial quand non utilisés — les
  supprimer casserait un futur `pnpm ace:new-site --force` de mise à jour.

## 5. Sorties garanties

- Un dépôt buildable (`pnpm install && pnpm check` vert, sauf
  `--skip-install`/`--skip-check`).
- Aucune route `/lab`, `/ace-lab`, `/engine`.
- Aucun secret, aucune identité d'un autre client connu.
- `docs/ACE-GENERATION-REPORT.md` documentant exactement ce qui a été généré.
- `ace.meta.json` traçant le commit moteur source (diff/upgrade futur).

## 6. Codes de sortie

`0` = succès (site généré et, sauf skip, vérifié). `1` = échec — argument
manquant/invalide, config invalide, recipe inconnue, features incompatibles,
sortie déjà occupée sans `--force`, contrôle anti-fuite en échec, ou une étape
de quality gate rouge. Un échec ne laisse **jamais** un message de succès.

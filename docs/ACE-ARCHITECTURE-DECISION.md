# ACE-ARCHITECTURE-DECISION — Option B (architecture modulaire dans l'app unique)

> Décision · 2026-07-17 · Statut : **adoptée** · Ré-examen : après le 2ᵉ site client réel

## Contexte

Le master prompt ACE propose deux architectures :

- **Option A** — monorepo pnpm : `apps/{starter,lab,sites/*}` + `packages/{ace-core,ace-motion,ace-three,ace-ui,...}`.
- **Option B** — architecture modulaire à l'intérieur de l'application unique, acceptée temporairement si la migration immédiate est trop risquée.

## Décision : Option B

`src/` **est** le moteur ACE. La modularité est obtenue par frontières internes,
pas par des paquets :

```
src/
├── ace/            # NOUVEAU — identité du moteur : version, presets DA,
│   │               # registres motion/scènes, scoring (introduit par étapes)
├── config/         # SEULE surface site↔moteur : site.ts, business.ts,
│                   # navigation.ts, motion.ts (+ futur preset de DA)
├── components/     # bibliothèque moteur (ui, motion, three, media, photo,
│                   # maps, conversion, effects, …)
├── lib/ hooks/     # logique moteur
├── scenes/         # scènes (démo aujourd'hui, Scene Library demain)
└── app/            # pages du site courant (starter neutre / site client)
```

La distribution multi-sites reste le modèle **« template repo »** : un nouveau
site = nouveau dépôt généré depuis celui-ci (`ace:new-site` remplira
`config/` + `input/` + pages). La version du moteur est tracée dans le site
généré (`ace.version`), ce qui permet des mises à jour par diff de template.

## Pourquoi pas l'Option A maintenant

1. **Loi projet** (CLAUDE.md) : « Un dépôt = un seul site client. » Un monorepo multi-sites la contredit frontalement.
2. **Base verte vérifiée** : `pnpm check` exit 0 (lint+typecheck+47 tests+build). Une migration monorepo remettrait en cause imports, tsconfig, ESLint flat config, Vitest, Playwright, skills, scripts assets et post-create — un risque massif sans bénéfice utilisateur immédiat.
3. **Outillage existant** : les 5 skills (`/build-site`…), `scripts/assets/*`, `audit-site` et le dev container supposent tous une app unique à la racine.
4. Le master prompt lui-même autorise l'Option B quand la migration immédiate est trop risquée — c'est exactement le cas.

## Critères de bascule vers l'Option A (documentés, mesurables)

Basculer si, après ≥ 2 sites clients livrés, l'un de ces points fait mal :

- des correctifs moteur doivent être rétro-portés à la main dans plusieurs dépôts et le diff de template ne suffit plus ;
- le moteur doit être versionné/publié indépendamment (registre npm privé) ;
- des équipes différentes travaillent moteur vs sites en parallèle.

Chemin de migration alors : extraire `src/{components,lib,hooks,ace}` vers
`packages/ace-*` (les frontières internes posées par l'Option B rendent cette
extraction mécanique), transformer `src/app` en `apps/site`.

## Conséquences immédiates

- Aucun déplacement de fichier vert ; introduction **additive** de `src/ace/`.
- Chaque étape ACE (fondations, starter, lab, générateur) doit laisser `pnpm check` vert.
- `docs/audits/MIGRATION-DECISIONS.md` liste ce qui est gardé/corrigé/reporté.

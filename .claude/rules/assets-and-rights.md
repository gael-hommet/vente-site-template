---
description: Pipeline d'assets (pnpm assets:*, sharp/ffmpeg/@gltf-transform) et règles de droits/sources.
globs: input/**,public/**,scripts/**
---

# Assets & droits

## Pipeline

- Traiter les médias via les scripts `pnpm assets:*` (sharp pour images, ffmpeg pour vidéo, `@gltf-transform` pour glTF).
- **Ne jamais écraser les originaux.** Les sources restent intactes dans `input/`.
- Écrire les sorties dans des **dossiers dédiés** (ex. `public/**` optimisé), séparés des sources.
- Compresser/optimiser avant intégration : formats modernes, tailles adaptées, modèles Draco/meshopt.

## Droits et traçabilité

- Journaliser chaque source dans `input/ASSET_SOURCES.md` (origine, licence, auteur, URL, date).
- **Ne jamais prétendre qu'un asset scrappé est libre de droits sans preuve.** Pas de licence supposée.
- Utiliser uniquement des assets dont les droits sont vérifiés pour un usage commercial.

## Démo vs production

- Les assets de démo sont temporaires : **les remplacer avant la mise en production**.
- Pas d'assets de démo lourds committés (voir performance).
- Ne jamais inventer/contrefaire du contenu client (logos, photos de réalisations, avis) à partir de sources non autorisées.

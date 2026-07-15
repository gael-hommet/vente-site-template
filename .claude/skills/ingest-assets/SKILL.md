---
name: ingest-assets
description: Analyse et optimise les ressources déposées dans input/assets/ (images, vidéos, modèles 3D) vers public/, sans écraser les originaux, et journalise les sources. À utiliser via /ingest-assets.
---

# /ingest-assets — Ingérer & optimiser les assets

## 1. Audit

- `pnpm assets:audit` — liste les fichiers, formats et poids ; repère les
  ressources au-dessus du budget.

## 2. Optimisation par type

- Images : `pnpm assets:images` (sharp → AVIF/WebP responsives + poster JPEG).
- Vidéos : `pnpm assets:video` (ffmpeg → MP4 + WebM + poster ; `--sequence`
  pour une séquence WebP scrubbable). ffmpeg est fourni par le devcontainer ;
  s'il manque, le script l'indique sans planter.
- Modèles 3D : `pnpm assets:models` (@gltf-transform → prune/dedup/resize/Draco).
- Tout d'un coup : `pnpm assets:all`.

## 3. Règles impératives

- **Ne jamais écraser les originaux.** Les sources restent dans `input/assets/` ;
  les sorties vont dans `public/{assets,sequences,models,posters}`.
- Renseigne `input/ASSET_SOURCES.md` : fichier, origine, licence, auteur, URL,
  date, usage (démo privée / production), droits confirmés, remplacement requis.
- Ne jamais prétendre qu'un asset récupéré est libre de droits sans preuve.
- Compresse avant intégration ; pas de texture géante ; formats modernes.

## 4. Rapport

Indique : fichiers optimisés, gains de poids estimés, formats générés, ressources
encore trop lourdes, et sources restant à documenter.

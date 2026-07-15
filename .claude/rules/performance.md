---
description: Budgets et règles de performance (images, fonts, splitting, lazy-load, CLS, bundle).
---

# Performance

## Chargement des médias

- Images via `next/image` uniquement (dimensionnement, formats modernes, lazy par défaut). Fournir `sizes` explicites.
- Fonts via `next/font` (self-host, pas de FOUT/FOIT, `display: swap`).
- Vidéos : posters obligatoires, `preload` limité, pas d'autoplay lourd bloquant.

## Code splitting et lazy-loading

- Imports dynamiques pour tout ce qui est lourd (3D, éditeurs, libs volumineuses). Pas dans le bundle initial.
- Code splitting par route/section ; lazy-load des sections sous la ligne de flottaison.
- `preload` limité et ciblé : ne pré-charger que le critique. Pas de préchargement massif.

## Stabilité visuelle (CLS)

- Dimensions explicites (width/height/aspect-ratio) sur images, vidéos, embeds et conteneurs de scène pour éviter le CLS.
- Réserver l'espace des éléments asynchrones (skeleton/placeholder aux bonnes dimensions).

## Bundle

- Ne jamais importer une dépendance inutilisée. Chaque dépendance dans le bundle doit être justifiée.
- Préférer les APIs natives aux librairies quand elles suffisent.
- Surveiller la taille du bundle ; éviter les imports barrel qui tirent trop de code (préférer les imports ciblés / tree-shakeables).

## Assets

- Pas d'assets de démo lourds committés dans le repo.
- Modèles/textures/vidéos compressés avant usage (voir assets-and-rights).
- Servir des posters pour les médias différés.

## Budgets

- Viser un bundle JS initial minimal ; déférer l'animation et la 3D.
- Mesurer avant/après sur les changements sensibles (LCP, CLS, TBT). Ne pas régresser les Core Web Vitals.

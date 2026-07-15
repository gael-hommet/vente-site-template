---
description: Conventions Next.js 16 / React 19 / TypeScript strict / Tailwind v4 pour les composants et la logique front.
globs: src/**/*.tsx,src/**/*.ts
---

# Frontend (Next 16 / React 19 / TS strict / Tailwind v4)

## Stack et versions
- Next.js 16, App Router uniquement, build/dev via Turbopack. Ne pas réintroduire le Pages Router.
- React 19.2 épinglé `<19.3`. NE JAMAIS monter React au-delà de 19.2 (sinon React Three Fiber casse).
- TypeScript en mode `strict` : pas de `any`, pas de `@ts-ignore` non justifié, typer les props et les retours publics.
- Tailwind v4 en CSS-first : les tokens de design sont des variables CSS (`--color-*`, `--radius-*`, etc.). Pas de `tailwind.config.js` massif en JS pour les tokens ; définir les tokens dans le CSS via `@theme`.

## Server vs Client Components
- Par défaut, tout composant est un Server Component. N'ajouter `"use client"` que si nécessaire (état local, effets, event handlers, hooks navigateur, Motion/GSAP/R3F).
- Garder la frontière client la plus basse et la plus petite possible : isoler la partie interactive dans un composant client dédié, laisser le reste en serveur.
- Ne pas importer de code serveur (accès FS, secrets, SDK serveur) dans un composant client.
- Le contenu textuel critique (titres, offre, coordonnées, CTA) doit être rendu côté serveur, jamais dépendre d'un effet client.

## Structure des composants
- Un composant par fichier, nommage `PascalCase`, fichiers cohérents avec le nom exporté.
- Props typées via `interface`/`type` explicite ; éviter les props booléennes ambiguës, préférer des unions.
- Extraire la logique réutilisable dans `src/lib/**` (hooks `useXxx`, utils purs). Pas de logique métier dans le JSX.
- Composants présentés découplés des sources de données ; passer les données en props.

## Styles et `cn()`
- Utiliser l'utilitaire `cn()` (clsx + tailwind-merge) pour composer/fusionner les classes conditionnelles. Ne pas concaténer les classes à la main.
- Pas de styles inline sauf valeurs dynamiques calculées (ex. transform runtime). Préférer les classes utilitaires et les variables CSS.
- Respecter les tokens : ne pas hardcoder des couleurs/espacements arbitraires quand un token existe.

## Général
- Ne jamais importer une dépendance inutilisée : chaque import doit finir dans le bundle pour une raison.
- Préférer une API native du navigateur/Next à une librairie quand elle fait mieux le travail.
- Pas de `console.log` résiduel en commit ; utiliser un logger conditionnel si besoin.

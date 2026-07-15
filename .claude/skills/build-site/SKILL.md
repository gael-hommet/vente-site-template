---
name: build-site
description: Construit le site commercial complet à partir de input/CLIENT_BRIEF.md et input/assets/. À lancer via /build-site après avoir rempli le brief et déposé les ressources. Orchestre recherche, stratégie, direction artistique, choix cinématique, code, optimisation, preview et tests.
---

# /build-site — Construire le site client

Objectif : transformer le brief et les assets en un site premium, cinématique,
accessible et prêt pour une démo privée. Travaille de façon autonome ; ne
demande une confirmation que pour les décisions réellement ambiguës ou risquées.

## 0. Pré-vol
- Lis `input/CLIENT_BRIEF.md`. S'il est vide ou absent : arrête-toi et demande à
  l'utilisateur de le remplir (ne rien inventer).
- Inventorie `input/assets/` (Glob) : logos, photos, vidéos, modèles 3D.
- Lis `CLAUDE.md` et les règles dans `.claude/rules/`.

## 1. Recherche factuelle (agent business-researcher)
- Délègue l'analyse du brief + assets + recherche web optionnelle.
- Produit une base de faits VÉRIFIÉS. Marque tout trou `[À CONFIRMER]`.
- **Interdit** : inventer avis, notes, prix, promos, certifications, adresses.
- Remplis `src/config/business.ts` uniquement avec des faits vérifiés.

## 2. Stratégie (agent conversion-strategist)
- Objectif de conversion, audience, objections, CTA primaire/secondaire,
  structure de persuasion (preuve, offre, FAQ).

## 3. Direction artistique (agent art-director)
- Ambiance sectorielle, tokens couleur/typo/matière, ressenti du mouvement.
- Applique les tokens dans `src/app/globals.css` (`--brand-*`, etc.) — pas de
  design IA générique.

## 4. Scénario & moteur cinématique (agents experience-director + three-director)
- Écris le déroulé chapitre par chapitre.
- Pour chaque section, choisis : vraie 3D (R3F) / vidéo scrub / séquence d'images
  / parallaxe 2.5D / statique — selon les assets et la performance.
- Toujours prévoir un fallback ; aucun contenu ne doit exiger WebGL.

## 5. Copie (agent copywriter)
- Titres, sections, libellés CTA, FAQ crédibles et spécifiques. Aucun faux avis.

## 6. Construction
- Assemble les pages dans `src/app/` avec les modules existants
  (`components/*`, `scenes/*`). Réutilise le design system ; n'invente pas de
  nouveaux primitives sans raison.
- Server Components par défaut ; `"use client"` minimal. Contenu critique rendu
  côté serveur.
- SEO : `buildMetadata`, JSON-LD (`localBusinessJsonLd` + type sectoriel),
  `sitemap.ts`, `robots.ts`. Conversion : formulaires locaux + CTA sticky.

## 7. Assets
- Lance `/ingest-assets` (ou `pnpm assets:all`) pour optimiser input/assets.
- Ne jamais écraser les originaux ; renseigner `input/ASSET_SOURCES.md`.

## 8. Optimisation (agent performance-engineer)
- Imports dynamiques, `sizes`, posters, budgets (`docs/PERFORMANCE-BUDGET.md`).

## 9. Preview & tests
- `/preview-site` pour lancer le serveur (port 3000, Codespaces).
- `pnpm check` (lint + typecheck + test + build). Corrige les causes des échecs,
  ne masque jamais un test.
- Vérifie a11y (`pnpm test:a11y`), reduced-motion, fallback WebGL.

## 10. Rapport
- Résume : pages créées, moteur cinématique par section, données `[À CONFIRMER]`,
  résultats des tests, URL de preview, fichiers à vérifier manuellement.
- **Ne déploie rien.** Suggère `/finalize-site` pour la mise au propre finale.

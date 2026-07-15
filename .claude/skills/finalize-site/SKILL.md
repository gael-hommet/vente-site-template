---
name: finalize-site
description: Nettoie, optimise, valide les contenus et les sources, exécute tous les tests et le build production, puis prépare le déploiement SANS déployer. À utiliser via /finalize-site juste avant la démo au prospect.
---

# /finalize-site — Finaliser (sans déployer)

## 1. Nettoyage
- Supprime le code mort, les imports inutiles, les `console.log` résiduels, les
  composants/pages de démo non utilisés par le site client.
- Vérifie qu'aucun asset de démo lourd n'est committé ; remplace les placeholders.

## 2. Optimisation finale
- `pnpm assets:all` (assets à jour, originaux préservés).
- Vérifie imports dynamiques, `next/image`+`sizes`, posters, budgets perf.

## 3. Validation du contenu (agents copywriter + business-researcher)
- Toute info affichée est vérifiée. **Aucun** avis/note/prix/promo/certification/
  récompense/adresse inventé. Les `[À CONFIRMER]` sont résolus ou retirés.
- `input/ASSET_SOURCES.md` renseigné : origine, licence, droits confirmés,
  remplacement requis avant production. Pas d'asset « libre de droits » sans preuve.

## 4. Tests complets
- `pnpm check` (lint + typecheck + test + build) doit passer.
- `pnpm test:e2e` + `pnpm test:a11y` si exécutables. Corrige les causes.

## 5. Build production
- `pnpm build` réussit sans erreur ni warning bloquant.
- Vérifie `/`, les pages du site, le fallback WebGL, reduced-motion, la console.

## 6. Préparation au déploiement (sans exécuter)
- Vérifie `.env.example` complet ; documente les variables requises en prod
  (`docs/OPTIONAL-INTEGRATIONS.md`).
- Rappelle quelles intégrations nécessitent une clé et lesquelles marchent sans.
- **Ne déploie pas. Ne pousse pas vers un service externe.** Donne à
  l'utilisateur les étapes exactes qu'il exécutera lui-même s'il le souhaite.

## 7. Rapport final
Récapitule : nettoyage effectué, résultats des tests, taille du build, contenus
validés, sources d'assets, ce qui reste à confirmer, et la procédure de
déploiement manuelle.

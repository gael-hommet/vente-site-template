---
description: Standards de test — TS strict, ESLint, Prettier, Vitest + RTL, Playwright + axe-core, `pnpm check`.
globs: tests/**,src/**/*.test.*,src/**/*.spec.*
---

# Testing & qualité

## Outillage

- TypeScript `strict`, ESLint et Prettier : pas de warning ignoré silencieusement, formatage appliqué.
- **Vitest + React Testing Library** pour l'unitaire/composant.
- **Playwright + axe-core** pour l'E2E et l'audit d'accessibilité automatisé.

## Commande d'intégration

- `pnpm check` = **lint + typecheck + test + build**. Doit passer avant tout commit significatif.
- Ne pas contourner `pnpm check` ni désactiver des étapes pour "faire passer".

## Règles de test

- Tester le comportement (rôles/labels accessibles) plutôt que l'implémentation ; privilégier les requêtes RTL par rôle.
- Couvrir : reduced-motion, fallbacks 3D, validation de formulaire (succès/erreur), navigation clavier, présence du contenu sans Canvas.
- **Ne jamais masquer un test qui échoue** (skip abusif, `.only`, expectations vides).
- **Ne jamais remplacer un vrai test par un test vide/factice** pour verdir la CI.
- Corriger la cause d'un échec, pas le test. Un test supprimé doit être justifié.

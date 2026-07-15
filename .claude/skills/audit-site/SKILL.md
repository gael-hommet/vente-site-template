---
name: audit-site
description: Audite le site sur conversion, design, responsive, SEO, accessibilité, performance, erreurs console et tests. À utiliser via /audit-site pour obtenir un rapport de défauts vérifiables avant finalisation.
---

# /audit-site — Auditer le site

Produis un rapport structuré et actionnable. Ne signale que des défauts
**vérifiables** (avec repro). Délègue aux agents spécialisés.

## 1. Automatique d'abord
- `pnpm audit:site` — hygiène SEO/a11y/perf statique.
- `pnpm lint` · `pnpm typecheck` · `pnpm test` — état de base.
- `pnpm test:e2e` et `pnpm test:a11y` (Playwright + axe-core) si l'environnement
  le permet ; sinon note pourquoi c'est non exécutable.

## 2. Conversion (agent conversion-strategist)
- CTA visible et atteignable partout (dont sticky mobile) ; click-to-call et
  itinéraire présents ; formulaires avec états succès/erreur ; parcours clair.

## 3. Design & responsive
- Cohérence des tokens, hiérarchie visuelle, points de rupture mobile/desktop,
  pas de débordement, pas de CLS visible.

## 4. SEO (agent seo-engineer)
- Metadata (title/description/canonical/OG/Twitter), `sitemap`, `robots`,
  JSON-LD valide et **cohérent avec le contenu visible** (aucune donnée inventée).

## 5. Accessibilité (agent accessibility-reviewer)
- Clavier, focus visible, contrastes, sémantique, skip link, reduced-motion,
  intro sautable, alternatives 3D, CTA sans terminer une scène.

## 6. Performance (agent performance-engineer)
- Poids du bundle initial, imports dynamiques, `next/image`+`sizes`, posters,
  budgets (`docs/PERFORMANCE-BUDGET.md`). Pas de régression Core Web Vitals.

## 7. Erreurs
- Console propre sur `/` et les pages clés (pas d'erreurs/warnings runtime).

## Rapport
Classe les problèmes par gravité (bloquant / majeur / mineur) avec fichier +
ligne + repro + correctif proposé. Ne corrige pas silencieusement pendant l'audit
sauf demande ; propose ensuite les correctifs.

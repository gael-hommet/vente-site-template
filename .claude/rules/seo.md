---
description: Système SEO — Metadata API, canonical, OG/Twitter, sitemap, robots, JSON-LD, business.ts source de vérité.
globs: src/lib/seo/**,src/app/**
---

# SEO

## Metadata API

- Utiliser la Metadata API de Next (`metadata`/`generateMetadata`), pas de balises `<head>` manuelles ad hoc.
- Définir un **title template** (`title.template`) et un titre par défaut cohérents.
- `canonical` défini sur chaque page. Éviter les contenus dupliqués.

## Partage social

- Balises **Open Graph** et **Twitter Card** complètes (title, description, image dimensionnée, type, url).
- Image OG dédiée et aux bonnes dimensions.

## Indexation

- `sitemap.ts` (sitemap) et `robots.ts` (robots) générés par Next.
- Bloquer l'indexation des environnements de preview/dev via env.

## Données structurées (JSON-LD)

- `LocalBusiness` + schéma sectoriel adapté au métier du client.
- **Breadcrumbs** (`BreadcrumbList`) et **FAQ** (`FAQPage`) quand la page les contient.
- JSON-LD valide, cohérent avec le contenu visible (pas de données non affichées/fausses).

## Source de vérité

- `business.ts` est la **source unique** des infos business (nom, adresse, téléphone, horaires, secteur, réseaux). SEO, JSON-LD, footer et formulaires consomment ce fichier.
- Ne jamais dupliquer/hardcoder ces infos ailleurs ; ne jamais inventer d'infos (voir security).

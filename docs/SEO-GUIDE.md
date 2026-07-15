# Guide SEO

Ce document décrit le système SEO du moteur : métadonnées, sitemap/robots, données structurées JSON-LD, et la source de vérité `src/config/business.ts`.

> **RÈGLE ABSOLUE** : ne **jamais inventer** d'avis, de notes, de récompenses, de prix ni d'adresses. Seuls les **faits vérifiés issus du brief** (`input/CLIENT_BRIEF.md`) alimentent le SEO et les données structurées. Un schéma qui affirme un fait faux est un risque juridique et de pénalité moteur.

---

## Source de vérité : `src/config/business.ts`

Toutes les informations d'entreprise (raison sociale, secteur, adresse, horaires, contacts, prestations, réseaux) sont centralisées dans **`src/config/business.ts`**. Les générateurs de métadonnées et de JSON-LD lisent depuis ce fichier. Renseigner uniquement des données confirmées par le client.

---

## Métadonnées — Metadata API (Next.js)

Le moteur utilise l'**API Metadata** de Next.js pour produire :

- **`title`** avec un **template** (ex. `%s | Nom de l'entreprise`) et un titre par défaut.
- **`description`** unique et pertinente par page.
- **URL canonique** (`alternates.canonical`) pour éviter le contenu dupliqué.
- **Open Graph** (`og:title`, `og:description`, `og:image`, type, locale) pour le partage social.
- **Twitter Card** (`summary_large_image`, titre, description, image).

Ces valeurs dérivent de `business.ts` et du contenu de chaque page.

## `sitemap.ts`

Génère dynamiquement le **sitemap.xml** (routes du site, `lastModified`, priorités). Servi automatiquement par Next.js à `/sitemap.xml`.

## `robots.ts`

Génère **robots.txt** : règles d'indexation et lien vers le sitemap. Servi à `/robots.txt`.

---

## Données structurées JSON-LD

Des générateurs produisent le balisage **schema.org** injecté dans les pages. Base : **LocalBusiness**, spécialisée selon le secteur du client.

### Types par secteur

| Secteur | Type schema.org |
| --- | --- |
| Automobile (concession/vente) | `AutoDealer` / `AutomotiveBusiness` |
| Beauté / esthétique | `BeautySalon` / `HealthAndBeautyBusiness` |
| Restauration | `Restaurant` |
| Hôtellerie | `Hotel` |
| Services professionnels | `ProfessionalService` |

Le générateur choisit le type le plus spécifique correspondant au secteur déclaré dans le brief, et retombe sur `LocalBusiness` par défaut.

### Champs alimentés (uniquement si vérifiés)

- Nom, description, secteur.
- Adresse postale (`PostalAddress`), géolocalisation si connue.
- Horaires d'ouverture (`openingHoursSpecification`).
- Téléphone, e-mail, URL, réseaux sociaux (`sameAs`).

> `aggregateRating`, `review`, `award`, `priceRange` ne sont ajoutés **que** si des données réelles et vérifiées existent dans le brief. En l'absence de preuve, ces champs sont **omis** — jamais fabriqués.

### FAQ & fil d'Ariane

- **FAQPage** : généré à partir des questions/réponses réelles fournies dans le brief.
- **BreadcrumbList** : fil d'Ariane reflétant la structure de navigation réelle du site.

---

## Bonnes pratiques

1. Remplir `src/config/business.ts` avant de générer le SEO.
2. Un `title` et une `description` **uniques** par page.
3. Vérifier la cohérence entre le contenu visible et le JSON-LD (Google pénalise les divergences).
4. Fournir une **image OG** dédiée (dimensions sociales) via le pipeline d'assets.
5. Contrôler le rendu du balisage avec les outils de test de données structurées.
6. En cas de doute sur un fait → **ne pas l'inclure**.

---

## Vérification

- `/audit-site` / `pnpm audit:site` inclut le contrôle SEO.
- Vérifier `/sitemap.xml` et `/robots.txt` en preview.
- Valider les métadonnées OG/Twitter via un outil de prévisualisation de partage.

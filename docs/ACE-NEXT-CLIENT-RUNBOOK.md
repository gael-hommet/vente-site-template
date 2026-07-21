# ACE — Runbook « prochain client »

Document **interne au moteur** (élagué à la génération). Procédure exacte pour
produire le prochain VRAI site client premium avec ACE. Un dépôt = un client.

> Règle d'intégrité permanente : ne jamais inventer un fait client (avis, note,
> prix, promo, certification, adresse, horaire). Laisser `[À CONFIRMER]` sinon.
> Voir `.claude/rules/security.md` et `CLAUDE.md`.

## 0. Vue d'ensemble

```
brief vérifié  ──▶  client.config.ts + content/content.json + assets
                          │
                          ▼
                 pnpm ace:new-site  ──▶  dépôt client validé (pnpm check vert)
                          │
                          ▼
        DA spécifique · QA · preview privée · livraison
```

## 1. Recherche & brief

- Remplir `input/CLIENT_BRIEF.md` à partir de faits **vérifiés** (délègue à
  l'agent `business-researcher` si besoin). Marquer chaque trou `[À CONFIRMER]`.
- Cadrer l'objectif de conversion, l'audience, les objections (agent
  `conversion-strategist`).

## 2. Sources & droits médias

- Journaliser chaque asset dans `input/ASSET_SOURCES.md` (origine, licence,
  auteur, URL, date). Aucun média aux droits incertains.
- Ne jamais prétendre qu'un asset scrappé est libre de droits sans preuve.

## 3. Configuration client — `input/client.config.ts`

Un fichier `.ts`, export par défaut typé `ClientConfigInput`
(`src/ace/config/client-schema.ts` = source de vérité). Champs clés :

- `identity` : nom, tagline, url, locale (faits).
- `industry` : un des `INDUSTRIES` (ou `other`).
- `goals.primaryConversion` : contact/quote/booking/inquiry/subscribe/purchase.
- `design` : `preset` (un des Design Languages), `motionIntensity`,
  `webglIntensity`, `density`, `darkMode`.
- `features` : contactForm, collections, stickyMobileCta, analytics, map…
  (certaines dérivées des intensités — voir `src/ace/config/features.ts`).
- `recipes` : ids par famille (voir `src/ace/recipes/catalog.ts` : hero,
  navigation, projects, storytelling, conversion, layout).
- `pages`, `collections`, `seo`, `proposal.isPrivateProposal`, `contact`.

Choisir les recipes selon l'intention créative — deux clients doivent recevoir
des sélections **différentes** (le rendu config-driven les rend visibles).

## 4. Contenu éditorial — `input/content/content.json`

Structure = `SiteContent` (`src/config/site-content.types.ts`) :
`hero` (eyebrow/title/subtitle/CTAs/media/sceneId), `story` (heading + chapters),
`collection` (heading + itemLabel + items), `conversion`, `nav`.

- Pour un site immersif WebGL : `hero.sceneId` = un id de la Scene Library
  (`src/ace/scenes/registry.ts`, ex. `demo.product-reveal`) et
  `design.webglIntensity` ≠ `none`.
- Tout fait non vérifié reste `[À CONFIRMER]` (visible, jamais silencieux).

## 5. Assets

- Déposer les sources dans `input/assets/`. Optimiser via `pnpm assets:all`
  (sharp/ffmpeg/gltf-transform) — les sources restent intactes.

## 6. Génération

```bash
pnpm ace:new-site \
  --name "Nom réel du client" \
  --slug nom-client \
  --brief input/CLIENT_BRIEF.md \
  --config input/client.config.ts \
  --content input/content \
  --assets input/assets \
  --out /workspaces/nom-client \
  --url https://nom-client.example
```

Le générateur valide la config (Zod + features + recipes) AVANT toute écriture,
exporte les fichiers suivis, élague Studio/Lab/Engine + docs internes, injecte
identité/Design Language/features/recipes/contenu, câble la home et l'en-tête
sur les recipes, active le mode proposition privée si demandé, contrôle
l'anti-fuite, puis exécute install + format + lint + typecheck + tests + build.

## 7. Rapport de génération

Lire `docs/ACE-GENERATION-REPORT.md` du site généré : recipes retenues,
features résolues, pages, collections, assets copiés, fichiers exclus,
anti-fuite, et **placeholders `[À CONFIRMER]` restants**.

## 8. DA spécifique & QA

- Remplacer chaque `[À CONFIRMER]` par un fait vérifié (`src/config/business.ts`,
  `content.json` régénéré ou édité).
- Affiner la direction artistique (si un preset moteur ne suffit pas, en créer
  un nouveau dans `src/ace/config/presets/` — AA par construction, testé).
- QA : `pnpm check` ; e2e `pnpm test:e2e` ; a11y `pnpm test:a11y`. Pour un site
  WebGL, `pnpm ace:audit-webgl <site> --expect webgl` (depuis le moteur).

## 9. Preview privée & livraison

- Preview locale : `pnpm dev` (Codespaces forwarde le port 3000).
- Proposition non sollicitée : `proposal.isPrivateProposal: true` →
  `robots.ts` noindex + `sitemap.ts` vide.
- **Ne jamais pousser ni déployer sans ordre explicite** du client/utilisateur.

## 10. Prévention des contaminations

- Un dépôt = un client. Ne jamais copier l'identité d'un autre client.
- Le contrôle anti-fuite bloque les identités d'AUTRES clients connus : étendre
  `KNOWN_CLIENT_IDENTITY_PATTERNS` dans `scripts/ace/new-site.mjs` à chaque
  nouveau client livré, pour qu'aucun futur site ne le réimporte.

## Exemple complet réel (gabarit)

```bash
# 1. remplir input/CLIENT_BRIEF.md, input/client.config.ts, input/content/content.json
# 2. déposer + optimiser les assets
pnpm assets:all
# 3. générer
pnpm ace:new-site \
  --name "Atelier Bellevue" --slug atelier-bellevue \
  --brief input/CLIENT_BRIEF.md --config input/client.config.ts \
  --content input/content --assets input/assets \
  --out /workspaces/atelier-bellevue --url https://atelier-bellevue.fr
# 4. lire le rapport, remplacer les [À CONFIRMER], QA
cd /workspaces/atelier-bellevue && pnpm check
```

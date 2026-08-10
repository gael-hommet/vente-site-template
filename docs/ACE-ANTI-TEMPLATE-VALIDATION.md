# ACE — Validation anti-template

Document **interne au moteur** (élagué à la génération). Prouve qu'ACE ne
produit pas « le même template repeint » : trois expériences issues du même
moteur — le site témoin **Site témoin A** (architecture, figé), la validation
**éditoriale** (Revue Liseré) et la validation **immersive** (Orbe) — sont
structurellement distinctes.

## 1. Méthode

- **Empreintes créatives** : `docs/anti-template/{temoin-a,editorial,immersive}-fingerprint.json`.
  Chaque champ est soit **extrait de la config** (recipes, Design Language,
  features — pour les deux validations générées), soit **observé** (DOM,
  captures — pour Site témoin A, hand-built, antérieur aux recipes). La source de
  chaque donnée est déclarée dans le champ `source` du fingerprint.
- **Détection automatisée** : `scripts/ace/compare-creative-fingerprints.mjs`
  (`pnpm ace:compare-fingerprints`) calcule une **proximité pondérée** par
  paire sur 19 dimensions (catégorielles = égal/différent ; textuelles =
  Jaccard sur mots-clés). Score ∈ [0,1], seuil `MAX_PROXIMITY = 0.5`. Résultat :
  `docs/anti-template/comparison.json`.
- **Tests** : `tests/unit/anti-template.test.ts` (7 tests : identiques,
  légèrement/radicalement différentes, données incomplètes, seuil, empreintes
  réelles distinctes).

Le score est un **garde-fou structurel**, pas un juge esthétique (voir
limites, §5).

## 2. Résultat de la comparaison automatisée

| Paire                      | Proximité | Seuil | Verdict  |
| -------------------------- | --------- | ----- | -------- |
| Site témoin A ↔ éditoriale | 0.016     | 0.5   | distinct |
| Site témoin A ↔ immersive  | 0.079     | 0.5   | distinct |
| éditoriale ↔ immersive     | 0.060     | 0.5   | distinct |

**Verdict global : ANTI-TEMPLATE CONCLUANT** — les trois expériences sont très
en-dessous du seuil de proximité (reproductible via `pnpm ace:compare-fingerprints`).

## 3. Pourquoi ce ne sont PAS le même template (au-delà des ids)

L'opposition ne tient pas à des ids différents : elle se lit dans le **rendu**.
Captures de référence : `docs/anti-template/captures/`.

### Silhouette & hero

- **Éditoriale** : titre typographique géant, **aucun média**, ancré en HAUT,
  respiration ample. Le texte EST le visuel.
- **Immersive** : hero **media-first** plein cadre, fond sombre, titre ancré
  en BAS (`items-end`), **scène WebGL montée** sous le hero.
- **Site témoin A** : intro architecturale sur-mesure (HeroIntro), hachures,
  cartouche, coupe bioclimatique.

Trois silhouettes de premier écran incompatibles.

### Navigation

- **Éditoriale** : folio — liens **numérotés** (01/02…) inline, menu texte
  mobile.
- **Immersive** : déclencheur **« MENU » → overlay plein écran** (role=dialog,
  liens display géants, fermeture Escape).
- **Site témoin A** : Folio maison, routes **métier** (/projets, /approche,
  /agence).

Trois paradigmes de navigation différents (inline numéroté / overlay plein
écran / folio architecte).

### Collection

- **Éditoriale** : **sommaire indexé** (liste numérotée, méta mono, aucune
  vignette).
- **Immersive** : **carrousel horizontal** à scroll-snap (chapitres).
- **Site témoin A** : **planches ProjectPlate** (élévations SVG par typologie).

Grille verticale indexée vs défilement horizontal vs planches techniques.

### Palette, surface, densité, mouvement

|         | Éditoriale            | Immersive                   | Site témoin A    |
| ------- | --------------------- | --------------------------- | ---------------- |
| Surface | claire (papier chaud) | sombre (noir cyan)          | papier chaux     |
| Densité | spacious              | compact                     | dense technique  |
| Motion  | subtle                | cinematic                   | cinématique GSAP |
| WebGL   | **non** (0 chunk)     | **oui** (4 chunks + canvas) | oui (maquette)   |

### WebGL — preuve réelle, pas déclarative

- Éditoriale : `pnpm ace:audit-webgl <site> --expect none` → **0 chunk WebGL,
  0 canvas**.
- Immersive : `--expect webgl` → **4 chunks WebGL + 1 canvas** en mode normal,
  et **fallback poster (0 canvas)** sous reduced-motion, h1 toujours lisible.

### Mobile

- Éditoriale : nav repliée en « Menu » texte, pas de sticky CTA.
- Immersive : overlay plein écran, sticky CTA mobile actif, hero plein cadre.

## 4. La seule parenté autorisée

Les trois sites partagent **uniquement** : le niveau de finition, la
performance, l'accessibilité (axe vert partout), la rigueur et la stabilité.
Aucune esthétique commune, aucune palette commune, aucune identité Site témoin A
imposée aux validations (contrôle anti-fuite vert : aucun « Orbe » dans
l'éditorial, aucun « Liseré » dans l'immersif, aucun littéral Site témoin A).

## 5. Limites honnêtes

- Le score de proximité est un **détecteur structurel**, pas une mesure de
  créativité. Deux recipes différentes comptent comme « différentes » même si
  un rendu pouvait converger — d'où les dimensions **DOM/mobile/média
  observées** qui complètent les ids.
- Le fingerprint d'Site témoin A est **observationnel** (site hand-built figé,
  antérieur au système de recipes) : ses champs `recipes.*` sont des
  rapprochements documentés, pas des ids moteur.
- Les captures sont **légères et inspectées**, prises en headless (GL logiciel)
  — le rendu WebGL réel sur GPU matériel est plus riche.

## 6. Reproduire

```bash
# (re)générer les deux validations
node scripts/ace/new-site.mjs --name "Revue Liseré" --slug ace-validation-editorial \
  --brief validation-inputs/editorial/CLIENT_BRIEF.md --config validation-inputs/editorial/client.config.ts \
  --content validation-inputs/editorial/content --assets validation-inputs/editorial/assets \
  --out /workspaces/ace-validation-editorial
node scripts/ace/new-site.mjs --name "Orbe" --slug ace-validation-immersive \
  --brief validation-inputs/immersive/CLIENT_BRIEF.md --config validation-inputs/immersive/client.config.ts \
  --content validation-inputs/immersive/content --assets validation-inputs/immersive/assets \
  --out /workspaces/ace-validation-immersive

# prouver le WebGL
pnpm ace:audit-webgl /workspaces/ace-validation-editorial --expect none
pnpm ace:audit-webgl /workspaces/ace-validation-immersive --expect webgl

# comparer les empreintes
pnpm ace:compare-fingerprints
```

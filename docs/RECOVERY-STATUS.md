# RECOVERY-STATUS — Vente Site Engine

État de récupération après interruption d'une session précédente (Codespace
arrêté / reconstruit, Claude Code réinstallé, conversation perdue). Ce document
est fondé sur des **preuves observables** (commandes exécutées, sorties réelles),
pas sur un rapport antérieur non vérifié.

- **Date de reprise** : 2026-07-15
- **Branche** : `main`
- **Règle appliquée** : préserver le travail existant, compléter/corriger, ne
  rien reconstruire depuis zéro, ne rien pousser ni déployer.

---

## 1. État Git

- Branche active : `main`.
- Au démarrage : arbre de travail **propre** (aucune modification non commitée).
- Remote : `origin` = `https://github.com/gael-hommet/vente-site-template`
  (aucun push effectué pendant la reprise).
- Dernier commit disponible : `90ed6d2 checkpoint: Vente Site Engine
partiellement construit avant reprise` (précédé de `2022944 Initial commit`).

## 2. Environnement observé (⚠️ substitut, pas le dev container cible)

| Élément     | Attendu (devcontainer.json)   | Observé à la reprise                         |
| ----------- | ----------------------------- | -------------------------------------------- |
| OS          | Debian (`typescript-node:22`) | **Alpine Linux 3.23 (musl)**                 |
| Node        | 22.x fourni par l'image       | **absent** → installé Node **24.17.0** (apk) |
| pnpm        | corepack (`pnpm@10.32.1`)     | **absent** → activé **10.32.1** (corepack)   |
| ffmpeg      | feature `ffmpeg-apt-get`      | **absent** → installé **8.0.1** (apk)        |
| Claude Code | installé par post-create      | non vérifiable ici (CLI hôte)                |

> Conséquence : l'environnement de reprise **n'est pas** le dev container décrit
> par `.devcontainer/devcontainer.json`. Les binaires glibc précompilés de
> nodejs.org ne s'exécutent pas sous musl (d'où l'installation via `apk`). Dans
> un **vrai Codespace** (image Debian), `scripts/post-create.sh` fournit Node,
> pnpm et Claude Code normalement. Aucune modification du `devcontainer.json`
> n'était nécessaire ; le manque venait de l'absence du script post-create.

## 3. Architecture présente (inspectée fichier par fichier)

Application Next.js unique (App Router) conforme à la cible :

```
src/app/            layout, page (dashboard moteur), lab/, api/lead, sitemap, robots, manifest
src/components/     ui, layout, motion, three, media, photo, maps, conversion, effects, analytics, seo, lab
src/scenes/         vehicle-journey, product-reveal, logo-reveal
src/lib/            animation, three, performance, seo, analytics, forms, accessibility, optional
src/config/         business.ts (source de vérité), site, navigation, motion
src/hooks/ src/types/
.claude/            rules(10), agents(10), skills(5), settings.json (+ settings.local.json gitignored)
docs/               11 documents (dont ce RECOVERY-STATUS)
scripts/            audit-site.mjs, convert-video.sh, assets/*, post-create.sh (créé pendant la reprise)
tests/              unit/setup.ts (+ suite unitaire écrite pendant la reprise)
```

## 4. Phases — état réel

**Terminées et vérifiées** :

- Fondations Next 16 / React 19.2 / TS strict / Tailwind v4 — **build OK**.
- Design system, Motion, GSAP/Lenis, 3D (R3F + boundary/fallback), média
  (image-sequence / scroll-video), photo 2.5D, maps (MapLibre), conversion
  (RHF+zod), SEO (metadata + JSON-LD + sitemap/robots/manifest), analytics.
- Page racine `/` (dashboard moteur) et `/lab` — présentes, **build statique OK**.
- Règles `.claude/rules/*`, agents, skills, `settings.json` — présents et valides.

**Corrigées pendant la reprise** :

- **Lint** : 8 erreurs + 16 warnings → **0/0** (voir §7).
- **post-create.sh** : **manquant** alors que `devcontainer.json` l'appelle →
  créé (idempotent, PATH persistant pour `claude`).

**Complétées pendant la reprise** :

- **Tests unitaires** : `tests/` ne contenait que `setup.ts` → **7 fichiers,
  47 tests Vitest + RTL** (schemas de formulaire succès/erreur + honeypot,
  reduced-motion, fallback WebGL, CTA `tel:`/directions, SEO/JSON-LD, formulaire
  ContactForm, contenu sans Canvas). `pnpm test` **vert**.
- **Tests e2e** : 5 specs Playwright créées dans `tests/e2e/` (home, lab,
  reduced-motion, forms, a11y/axe) — voir §8 pour l'exécution.
- `docs/RECOVERY-STATUS.md` : absent → ce fichier.

## 5. Dépendances

- **CORE (installées, compilent, build vérifié)** : next 16.2.10, react/react-dom
  19.2.4, three 0.185 + @react-three/fiber 9 + drei 10 + postprocessing, gsap,
  lenis, motion, maplibre-gl, react-hook-form + zod + @hookform/resolvers,
  zustand, maath, @use-gesture/react, class-variance-authority, clsx,
  tailwind-merge, lucide-react ; dev : vitest, RTL, playwright + axe, sharp,
  @gltf-transform/cli, tailwindcss v4, typescript, eslint/prettier.
- **ADAPTER-ONLY (non installées, chargées à l'exécution si présentes)** :
  Theatre.js, Rive, Spline, ShaderGradient, @paper-design/shaders, liquid-glass,
  @react-three/rapier. Aucune n'est importée statiquement (`grep` = 0) ; le
  chargeur `src/lib/optional/load.ts` (`turbopackIgnore`) rend l'import
  non-analysable et tolérant à l'absence → **le build ne casse jamais**.
- **REJECTED** : aucune à ce stade (voir `docs/COMPATIBILITY.md`).

## 6. Skills & Agents

- **Skills** (5) avec frontmatter valide, détectées par l'hôte :
  `/build-site`, `/audit-site`, `/finalize-site`, `/preview-site`,
  `/ingest-assets`.
- **Agents** (10) : business-researcher, conversion-strategist, copywriter,
  art-director, experience-director, three-director, seo-engineer,
  performance-engineer, accessibility-reviewer, qa-engineer — outils restreints,
  agents d'audit en lecture seule.

## 7. Commandes — ce qui passe / échoue

| Commande                       | Avant reprise               | Après corrections                              |
| ------------------------------ | --------------------------- | ---------------------------------------------- |
| `pnpm install`                 | —                           | ✅ OK                                          |
| `pnpm typecheck`               | ✅ OK                       | ✅ OK                                          |
| `pnpm lint`                    | ❌ 8 erreurs, 16 warnings   | ✅ 0 erreur, 0 warning                         |
| `pnpm build`                   | ✅ OK (9 routes)            | ✅ OK                                          |
| `pnpm test`                    | ❌ « No test files found »  | ✅ 7 fichiers, 47 tests                        |
| `pnpm check`                   | ❌ (bloqué par lint + test) | ✅ **vert** (lint+typecheck+test+build)        |
| `pnpm audit:site`              | —                           | ✅ 9 OK, 1 warning (`<img>` panorama), 0 échec |
| `pnpm assets:audit`            | —                           | ✅ OK (0 asset, budget respecté)               |
| Smoke `/`, `/lab`, `/api/lead` | —                           | ✅ 200 ; form local ok/422/honeypot            |

**Causes des échecs lint** (Next 16 embarque `eslint-plugin-react-hooks` durci) :

- `react-hooks/set-state-in-effect` : setState synchrone dans un effet →
  corrigé via `useSyncExternalStore` (useMediaQuery, ThemeProvider, WebGL client
  detection) et report du setState hors du corps synchrone (BusinessMap async
  IIFE, ImageSequenceDemo rAF).
- `react-hooks/refs-in-render` : lecture de ref pendant le rendu dans
  `SmoothScrollProvider` → suppression de l'état `ready`, exposition via
  `getLenis()`.
- `react-hooks/exhaustive-deps` (ImageSequencePlayer) : cycle draw↔schedule →
  cassé avec un `drawRef` et un `schedule` stable.
- Warnings « unused eslint-disable » retirés ; `no-unused-expressions` désactivé
  **uniquement** pour `scripts/**/*.mjs` (idiomes CLI).

## 8. Risques & points à vérifier manuellement

- **Playwright** : les navigateurs (WebKit/Firefox/Chromium) ne s'installent pas
  facilement sous Alpine/musl. Les specs e2e/a11y doivent être exécutées dans un
  vrai Codespace Debian (`pnpm exec playwright install`). `pnpm check` **n'inclut
  pas** l'e2e, donc la validation principale reste verte sans navigateurs.
- **Rendu visuel `/` et `/lab`** : vérifiés au build (prérendu statique) ; à
  confirmer visuellement via `pnpm dev` (console sans erreur).
- **Claude Code après rebuild** : garanti par `scripts/post-create.sh`
  (PATH persistant `~/.local/bin`), à valider dans un Codespace Debian réel.

## 9. Ordre des opérations restantes

1. ✅ Toolchain (Node/pnpm/ffmpeg) + `post-create.sh`.
2. ✅ Corriger lint → 0/0 ; typecheck + build verts.
3. ✅ Suite de tests unitaires (Vitest + RTL) → `pnpm test` vert (47 tests).
4. ✅ Specs Playwright `tests/e2e/` (home, lab, reduced-motion, forms, a11y).
5. ✅ `pnpm check` complet vert.
6. ✅ Vérifier `/`, `/lab`, endpoints via serveur de prod (curl, 200).
7. ✅ Checkpoints Git locaux (aucun push).
8. ✅ Rapport final.

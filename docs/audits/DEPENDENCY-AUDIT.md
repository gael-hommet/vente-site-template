# DEPENDENCY-AUDIT — Dépendances réellement installées

> Audit ACE · 2026-07-17 · `package.json` + `pnpm-lock.yaml` (frozen install OK)

## 1. Runtime (dependencies)

| Paquet | Version | Rôle | Statut |
| --- | --- | --- | --- |
| next | 16.2.10 (exact) | App Router + Turbopack | CORE |
| react / react-dom | 19.2.4 (exact) | **Épinglé < 19.3** (R3F casse au-delà) | CORE |
| three | ^0.185.1 | Moteur 3D | CORE |
| @react-three/fiber | ^9.6.1 | React ↔ three | CORE |
| @react-three/drei | ^10.7.7 | Helpers R3F | CORE |
| @react-three/postprocessing + postprocessing | ^3.0.4 / ^6.39.2 | PostFX (tier ULTRA seulement) | CORE |
| gsap | ^3.15.0 | ScrollTrigger uniquement (plugin gratuit) | CORE |
| lenis | ^1.3.25 | Smooth scroll (off si reduced-motion) | CORE |
| motion | ^12.42.2 | Micro-interactions | CORE |
| maplibre-gl | ^5.24.0 | Cartes sans clé API | CORE |
| react-hook-form + @hookform/resolvers + zod | ^7.81 / ^5.4 / ^4.4.3 | Formulaires + validation partagée | CORE |
| zustand | ^5.0.14 | Stores quality/scene | CORE |
| @radix-ui/react-dialog, react-slot | ^1.x | Dialog/Drawer accessibles | CORE |
| class-variance-authority, clsx, tailwind-merge | — | `cn()` + variants | CORE |
| lucide-react | ^1.24.0 | Icônes (optimizePackageImports) | CORE |
| maath | ^0.10.8 | Maths anim 3D | CORE |
| @use-gesture/react | ^10.3.1 | Gestes (BeforeAfter, galeries) | CORE |
| server-only | ^0.0.1 | Garde-fou deliver.ts | CORE |

**Adaptateurs sans dépendance installée** (chargés à l'exécution si présents,
via `src/lib/optional/load.ts` + `turbopackIgnore`) : Theatre.js, Rive, Spline,
ShaderGradient. C'est volontaire : zéro poids tant qu'un client n'en a pas besoin.

## 2. Dev

Vitest 4 + RTL 16 + jest-dom + user-event + jsdom 29 · Playwright 1.61 +
@axe-core/playwright · ESLint 9 + eslint-config-next · Prettier 3 +
plugin-tailwindcss · Tailwind 4 + @tailwindcss/postcss · sharp 0.35 ·
@gltf-transform/cli 4.4 · TypeScript 5.

## 3. Problèmes détectés

### P1 — `pnpm.overrides` ignoré par pnpm 10 (réel, vérifié)

`pnpm install` affiche : *« The "pnpm" field in package.json is no longer read
by pnpm »*. L'épinglage React 19.2.4 **n'est donc pas appliqué de force** aux
dépendances transitives. Aujourd'hui inoffensif (react est une dep directe
exacte), mais le verrou anti-19.3 annoncé est illusoire.
**Correctif** : déplacer les overrides dans `pnpm-workspace.yaml` (fait en
phase de stabilisation).

### P2 — Aucun paquet inutilisé détecté

Chaque dépendance a des usages réels dans `src/` (vérifié par inventaire des
imports lors de la récupération du 2026-07-15, re-confirmé par `pnpm check`
vert : eslint interdit les imports morts).

## 4. Contraintes non négociables

- **pnpm uniquement** (10.32.1 via corepack, `packageManager` épinglé). Jamais `--force` / `--legacy-peer-deps`.
- **React < 19.3** tant que R3F 9 n'a pas déclaré la compat.
- `onlyBuiltDependencies` (pnpm-workspace.yaml) : sharp, unrs-resolver, esbuild, @tailwindcss/oxide — liste d'autorisation de scripts postinstall, à conserver.

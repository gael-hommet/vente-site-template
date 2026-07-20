# UI-AUDIT — Système UI & design tokens

> Audit ACE · 2026-07-17

## 1. Tokens (Tailwind v4 CSS-first) — `src/app/globals.css`

- Config **entièrement CSS-first** : variables sémantiques (`--background`, `--surface{,-2,-3}`, `--muted`, `--border`, `--ring`) en **oklch**, accent `--brand-*` volontairement neutre et **conçu pour être surchargé par client** — exactement le mécanisme dont le Design Language ACE a besoin.
- Thème sombre double déclenchement : `data-theme` explicite **ou** `prefers-color-scheme`, avec `color-scheme` correct ; `ThemeScript` dans le layout évite le flash.
- Tokens complets : radii (xs→2xl), ombres (sm/md/lg/glow), verre (`--glass-*` avec repli opaque + `@supports backdrop-filter`), durées (fast→cinematic), easings nommés.
- `@theme inline` mappe tout vers les utilitaires Tailwind (`bg-surface`, `ease-emphasized`…). Fonts via `next/font` (Geist, Geist Mono, Space Grotesk) exposées en `--font-{sans,mono,display}`.
- Base : focus-visible global lisible, `::selection` marqué, **reduced-motion global en CSS** (animations ~0ms), `.skip-link`, `.sr-only`.

## 2. Composants `ui/`

12 primitives : button (+cva variants), glass-button, badge, card, container,
dialog/drawer (Radix — focus trap et aria gérés), field (label/erreur liés),
section, states (loading/empty/error), typography. Composition via `cn()`
(clsx + tailwind-merge) partout ; pas de concaténation manuelle constatée.

## 3. Écarts pour ACE

| Constat                              | Conséquence                               | Recommandation                                                                                                      |
| ------------------------------------ | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Un seul « thème » de marque (neutre) | Chaque client repart des variables brutes | Design Language ACE : presets de DA = fichiers de tokens (`--brand-*`, fonts, radius, densité) versionnés et nommés |
| Pas de page de référence des tokens  | La DA se lit dans le CSS                  | `/ace-lab` doit exposer une section tokens (swatches, type scale, motions)                                          |
| Typo display unique (Space Grotesk)  | Identité uniforme entre sites             | Le preset de DA doit piloter le choix `next/font`                                                                   |

## 4. Verdict

Système de tokens solide et déjà pensé pour la personnalisation par client.
Aucune correction nécessaire ; ACE doit **construire dessus** (presets), pas le
remplacer.

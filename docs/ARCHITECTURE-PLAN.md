# Architecture Plan — Vente Site Engine

> Production template for building premium, cinematic, interactive, 3D, performant,
> accessible and SEO-optimized single-client commercial websites — driven by Claude Code.

This document is the Phase 0 deliverable: it records the chosen architecture, the
dependency strategy, compatibility risks and validation criteria **before** any code
is written. It is the contract the rest of the build follows.

---

## 1. Environment (audited)

| Tool        | Version          | Notes                                                                |
| ----------- | ---------------- | -------------------------------------------------------------------- |
| OS          | Ubuntu 24.04     | Codespaces devcontainer                                              |
| Node        | v24.14.0         | Compatible with Next 16                                              |
| npm         | 11.9.0           | Not used as PM (pnpm is the single PM)                               |
| pnpm        | 10.32.1          | **Single package manager**, lockfile committed                       |
| corepack    | 0.34.6           | Pins pnpm via `packageManager` field                                 |
| git         | 2.53.0           |                                                                      |
| Claude Code | 2.1.209          | Drives skills/agents/rules/hooks                                     |
| ffmpeg      | **absent**       | Installed via devcontainer feature; video scripts degrade gracefully |
| CPU / RAM   | 2 vCPU / 7.8 GiB | Modest → keep bundle lean, avoid parallel builds                     |
| Disk        | ~20 GiB free     | Playwright browsers installed on demand only                         |

## 2. Architecture

**Single Next.js App Router application** (no monorepo, no Turborepo). Each repo made
from this template is exactly one client site, so a monorepo adds cost with no benefit.

- Next.js **16** (App Router, Turbopack) + React **19.2** + TypeScript **strict**
- Tailwind CSS **v4** (CSS-first config) + design tokens as CSS custom properties
- `src/` directory, `@/*` path alias
- Clear module boundaries under `src/`:
  - `components/` — UI, layout, conversion, effects, motion, three, maps, fallbacks
  - `scenes/` — self-contained cinematic scene modules
  - `lib/` — animation, three, performance, seo, analytics, forms, assets, a11y, validation
  - `config/`, `hooks/`, `types/`, `content/`
- `input/` (client brief + assets), `public/` (optimized assets), `scripts/`, `docs/`, `tests/`
- `.claude/` — rules, skills, agents, hooks, settings
- `.devcontainer/` — reproducible Codespace

### Strict separation of animation responsibilities

| Layer                | Owns                                                                    |
| -------------------- | ----------------------------------------------------------------------- |
| Motion               | micro-interactions, enter/exit, hover/press, layout, gestures           |
| GSAP + ScrollTrigger | cinematic timelines, pinned scenes, scrub, camera/sequence control      |
| Lenis                | smooth scroll, synced to ScrollTrigger, disabled on reduced-motion      |
| R3F                  | WebGL scenes only; never SSR; always behind a WebGL boundary + fallback |

## 3. Version pins (compatibility-critical)

- `react` / `react-dom` pinned to **19.2.x** — `@react-three/fiber@9` peer requires `>=19 <19.3`.
  Floating to 19.3 would break the 3D engine. Enforced via exact versions + `pnpm.overrides`.
- `three` 0.185, `@react-three/fiber` 9, `@react-three/drei` 10, `@react-three/postprocessing` 3
  — mutually compatible set (drei peer `three >=0.159`, `fiber ^9`).
- `zod` **v4** with `@hookform/resolvers` (v4-aware) + `react-hook-form` 7.

## 4. Dependency matrix (strategy)

Every optional capability is reachable, but only what a site actually uses is bundled.

### CORE — installed, tested, activated

next, react, react-dom, typescript, tailwindcss, @tailwindcss/postcss,
class-variance-authority, clsx, tailwind-merge, lucide-react,
motion, gsap, lenis,
three, @react-three/fiber, @react-three/drei, @react-three/postprocessing, postprocessing, maath, zustand, @use-gesture/react,
react-hook-form, zod, @hookform/resolvers,
maplibre-gl

### CORE (dev/test)

eslint + eslint-config-next, prettier, prettier-plugin-tailwindcss,
vitest, @vitejs/plugin-react, jsdom, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event,
@playwright/test, @axe-core/playwright,
sharp, @gltf-transform/cli

### ADAPTER ONLY — integration written, package NOT installed (avoids bundle bloat + build risk)

Rationale: each needs an external asset (`.riv`, Spline scene, HDR) or ships its own
WebGL/three copy that can clash with our pinned `three`. We provide a dynamic-import
adapter + graceful fallback, so a future site enables it by installing one package.

- `@theatre/core` / `@theatre/studio` — scroll-driven camera capability is delivered
  natively via GSAP ScrollTrigger + R3F (no Theatre needed for the core feature); Theatre
  adapter + workflow documented. Keeps Studio out of production and avoids version friction.
- `@shadergradient/react` — `ShaderGradientBackground` ships a CSS/canvas gradient fallback;
  adapter loads the package if present.
- `liquid-glass-js`, `@paper-design/shaders-react` — `GlassSurface`/`LiquidMetalLogo` use
  layered CSS `backdrop-filter` + optional canvas shader; no hard dependency.
- `@rive-app/react-canvas` — `RiveScene` adapter, poster fallback.
- `@splinetool/react-spline` — `SplineScene` adapter, poster fallback.

### REJECTED (for the CORE build)

- `@react-three/rapier` — physics not required by any core scene; heavy WASM. Documented
  as opt-in in COMPATIBILITY.md; add only if a client scene needs simulation.

Full per-package reasoning lives in `docs/COMPATIBILITY.md`.

## 5. Compatibility risks & mitigations

1. **React 19.3 drift breaking R3F** → exact pin + `pnpm.overrides` + typecheck gate.
2. **Optional libs bundling their own `three`** → not installed in CORE; adapters dynamic-import.
3. **Tailwind v4 + shadcn** → we hand-author accessible primitives (CVA + Radix-free where
   possible) instead of depending on a generator, so Tailwind-major churn can't break UI.
4. **ffmpeg absent locally** → provided by devcontainer feature; asset scripts detect absence
   and print install guidance instead of crashing.
5. **2-core build host** → single-threaded builds, Playwright browsers installed on demand,
   no heavy demo assets committed.
6. **WebGL unavailable (headless/old device)** → every 3D path has an image/video/CSS fallback;
   no site content requires WebGL to be readable.

## 6. Validation criteria (Definition of Done gate)

The template is "done" only when all of these pass:

- `pnpm install` clean (no `--force`, no `--legacy-peer-deps`)
- `pnpm lint` — 0 errors
- `pnpm typecheck` — 0 errors (strict)
- `pnpm test` — unit tests green
- `pnpm build` — production build succeeds
- `pnpm test:e2e` / `pnpm test:a11y` — runnable; core specs pass in-environment
- `/` renders the sober engine status screen; `/lab` renders all module demos
- Reduced-motion honored; WebGL fallback verified; no console errors on core pages
- `.claude/` skills + agents + rules + settings valid for Claude Code 2.1.x
- Devcontainer + `scripts/post-create.sh` prepare the next Codespace idempotently
- README describes the non-technical end-to-end journey

## 7. Build order

0. Plan (this doc) → 1. Scaffold + core deps → 2. Tokens & design system →
1. Animation engine → 4. 3D engine + quality tiers → 5. Cinematic (native + Theatre adapter) →
2. Three video modes → 7. Asset pipeline → 8. Special FX adapters → 9. Photo/2.5D →
3. Maps → 11. Conversion → 12. SEO → 13. Analytics → 14. A11y/perf →
4. Tests → 16. Lab + home → 17. Claude config → 18. Devcontainer → 19. Brief →
5. Docs → 21. Final validation.

Verify (`typecheck` + `build`) is run at checkpoints, not just at the end.

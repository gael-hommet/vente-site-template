# TEMPLATE-INVENTORY — Inventaire complet du dépôt

> Audit ACE · 2026-07-17 · HEAD `cd5958a` (branche `main`, arbre propre)
> Méthode : lecture directe des fichiers (aucune supposition).

## 1. Vue d'ensemble

Application **unique** Next.js 16 (App Router, Turbopack) dans `src/`, avec
outillage complet (tests, pipeline assets, skills Claude Code, dev container).
Pas de monorepo. Un dépôt = un site client (loi CLAUDE.md).

```
.
├── .claude/            # rules/* (8), skills/* (5), settings
├── .devcontainer/      # Dockerfile (typescript-node:22 + ffmpeg + git-lfs), devcontainer.json
├── docs/               # 10 guides + RECOVERY-STATUS + ce dossier audits/
├── input/              # CLIENT_BRIEF.md, assets/ (vide), references/ (vide)
├── public/             # assets/, models/, posters/, sequences/ (placeholders SVG légers)
├── scripts/            # post-create.sh, audit-site.mjs, assets/*.mjs (6), convert-video.sh
├── src/                # l'application (détail ci-dessous)
└── tests/              # unit/ (8 fichiers, 47 tests) + e2e/ (5 specs Playwright)
```

## 2. `src/` — détail

| Zone                             | Contenu                                                                                                                                                                                                 | Fichiers |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `app/`                           | `layout.tsx`, `page.tsx`, `lab/page.tsx`, `api/lead/route.ts`, `sitemap.ts`, `robots.ts`, `manifest.ts`, `globals.css`                                                                                  | 9        |
| `components/ui/`                 | button, glass-button, badge, card, container, dialog, drawer, field, section, states, typography + index                                                                                                | 12       |
| `components/layout/`             | site-header, site-footer, navigation, skip-link, theme (Provider+Script)                                                                                                                                | 5        |
| `components/motion/`             | SmoothScrollProvider (Lenis+GSAP), Reveal, ScrollScene, PinnedSequence, ParallaxLayer, MagneticButton, ScrollProgress, ChapterTimeline, SplitTextFallback                                               | 9        |
| `components/three/`              | AdaptiveCanvas, ThreeCanvas, WebGLBoundary, WebGLFallback, DeviceQualityProvider, PerformanceController, SceneLoader, ScrollCamera, CameraRig, EnvironmentRig, PostFX, Model, Hotspot, stages           | 15       |
| `components/media/`              | ScrollVideo, ScrollImageSequence, ImageSequencePlayer, MediaFallback                                                                                                                                    | 4        |
| `components/photo/`              | BeforeAfter, DepthParallax, InteractiveHotspots, InteriorGallery, KenBurnsScene, LayeredPhoto, MaskReveal, PanoramaAdapter                                                                              | 8        |
| `components/maps/`               | BusinessMap (maplibre), AnimatedMapCamera, LocationMarker, RouteReveal, SceneToMapTransition, MapFallback                                                                                               | 6        |
| `components/conversion/`         | ContactForm, LeadForm, QuoteRequest, FAQ, ctas, sections, form-parts, ConversionFooter                                                                                                                  | 9        |
| `components/effects/`            | GlassSurface, GlassNavigation, LiquidMetalLogo + adaptateurs optionnels (Rive, Spline, ShaderGradient)                                                                                                  | 6        |
| `components/analytics/` + `seo/` | Analytics (env-gated), JsonLd                                                                                                                                                                           | 2        |
| `components/lab/`                | LabShell, LabSection, canvases, demos (Journey, ImageSequence, Map, SceneToMap), QualitySelector                                                                                                        | 7        |
| `scenes/`                        | vehicle-journey, product-reveal, logo-reveal (scènes R3F de démonstration)                                                                                                                              | 3        |
| `lib/`                           | animation/gsap, three/{webgl,scene-store}, performance/{quality,store}, seo/{metadata,jsonld}, forms/{schemas,submit,deliver}, accessibility/reduced-motion, analytics/track, optional/load, utils (cn) | 15       |
| `config/`                        | site.ts (env-driven), business.ts (source de vérité, placeholder honnête), navigation.ts, motion.ts                                                                                                     | 4        |
| `hooks/`                         | useQuality, useReducedMotion, useMediaQuery, useScrubProgress                                                                                                                                           | 4        |
| `types/`                         | index.ts (BusinessConfig, DeviceProfile, QualityTier…)                                                                                                                                                  | 1        |

## 3. Tests

- **Unit (Vitest+RTL)** : contact-form, ctas, forms-schemas, home-content, reduced-motion, seo, webgl-boundary (+setup). **47 tests, tous verts** (vérifié le 2026-07-17 via `pnpm check`).
- **E2E (Playwright+axe)** : home, lab, forms, a11y, reduced-motion. Chromium installé le 2026-07-17 (`playwright install chromium --with-deps` OK).

## 4. Skills & docs

- Skills : `/build-site`, `/preview-site`, `/audit-site`, `/finalize-site`, `/ingest-assets`.
- Docs : ARCHITECTURE-PLAN, ASSET-PIPELINE, COMPATIBILITY, DEFINITION-OF-DONE, OPTIONAL-INTEGRATIONS, PERFORMANCE-BUDGET, RECOVERY-STATUS, SEO-GUIDE, STACK, TROUBLESHOOTING, WORKFLOW.

## 5. Verdict

Template **riche, cohérente et vérifiée verte**. Rien à reconstruire : la base
ACE existe déjà sous un autre nom. Les manques sont de l'ordre de
l'industrialisation (génération de site, bibliothèques de motion/scènes
nommées, scoring), pas de la fondation.

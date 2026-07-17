# MIGRATION-DECISIONS — Ce qu'on garde, corrige, transforme, reporte

> Audit ACE · 2026-07-17 · Synthèse des 10 audits. Rien n'est reconstruit de zéro.

## 1. GARDER TEL QUEL (fondation ACE, vérifiée verte)

- Stack : Next 16.2.10 / React 19.2.4 (<19.3) / TS strict / Tailwind v4 CSS-first.
- Chaîne 3D : WebGLBoundary → AdaptiveCanvas → tiers ULTRA/BALANCED/LITE → budgets → fallback requis.
- Chaîne motion : gsap.ts central (ScrollTrigger seul), SmoothScrollProvider (Lenis+ticker GSAP, reduced-motion off), loi de séparation Motion/GSAP/Lenis.
- Tokens design (oklch, `--brand-*` surchargeable par client, dark auto+toggle).
- Conversion : zod partagé, `/api/lead` simulé, adaptateurs env-gated, deliver server-only.
- SEO : Metadata API, sitemap/robots/manifest, JSON-LD dérivé de `business.ts`.
- Tests : 47 unit + 5 specs e2e/axe ; `pnpm check` comme porte de commit.
- Dev container + post-create idempotent + skills `/build-site` → `/finalize-site`.
- Garde-fous : intégrité contenu (`business.ts` faits vérifiés), pas de secrets, pas de déploiement sans ordre.

## 2. CORRIGER MAINTENANT (stabilisation — petits, sans risque)

1. Déplacer `pnpm.overrides` (react/react-dom 19.2.4) de `package.json` vers `pnpm-workspace.yaml` (pnpm 10 ignore le champ `pnpm` de package.json → le verrou React n'est pas appliqué).
2. Créer `.gitattributes` : règles Git LFS pour les sources lourdes (`input/assets` binaires, glb/gltf/hdr/exr/ktx2, masters vidéo/audio, PSD/AI) — git-lfs est installé mais non configuré.
3. `scripts/post-create.sh` : installation best-effort des browsers Playwright (chromium) pour que les e2e marchent sur tout Codespace neuf.

Validation : `pnpm check` re-exécuté après ces trois changements.

## 3. TRANSFORMER PROGRESSIVEMENT (fondations ACE, Option B)

- Introduire la couche moteur nommée `src/ace/` (identité, presets, registres) **sans déplacer** les composants verts existants ; la frontière moteur/site se renforce par étapes, pas par big-bang.
- `config/` devient le seul point de contact site↔moteur (site.ts, business.ts, futur `ace.config`/preset de DA).
- Étoffer `config/motion.ts` en point d'entrée Motion Library.

## 4. REPORTER (décision explicite)

| Sujet | Pourquoi reporté | Ré-examen |
| --- | --- | --- |
| Option A (monorepo pnpm apps/+packages/) | Loi « un dépôt = un site client » ; skills et scripts supposent l'app unique ; migration risquée sans bénéfice immédiat | Quand ≥2 sites réels auront prouvé le besoin de versionner le moteur séparément — voir ACE-ARCHITECTURE-DECISION |
| CI GitHub Actions | « Ne jamais pousser sans ordre explicite » ; inutile tant que le flux est Codespace-local | À la demande de l'utilisateur |
| Budgets perf exécutoires / Lighthouse | Mieux placés dans l'ACE Score (étape 15) que comme script isolé | Étape 15 |
| Firefox/WebKit Playwright | Chromium suffit pour la boucle courante ; les projets skippent proprement | Avant une livraison client réelle |

## 5. INTERDITS RECONDUITS

Jamais : données client inventées · secrets committés · déploiement/push sans
ordre · `--force`/`--legacy-peer-deps` · React ≥ 19.3 · test masqué/vidé ·
écrasement des sources `input/`.

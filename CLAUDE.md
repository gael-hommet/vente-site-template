@AGENTS.md

# Vente Site Engine — règles permanentes

Template de production pour générer, dans un Codespace, des **sites commerciaux
premium** : cinématiques, interactifs, 3D, performants, responsive, accessibles,
optimisés SEO et conçus pour convertir. **Un dépôt = un seul site client.**

Les règles détaillées vivent dans `.claude/rules/*` (chargées par chemin). Ce
fichier ne contient que l'essentiel permanent.

## Architecture

- **Next.js 16** (App Router, Turbopack) · **React 19.2** · **TypeScript strict** · **Tailwind v4** (tokens CSS-first).
- Application unique dans `src/` : `app/`, `components/{ui,layout,motion,three,media,effects,photo,maps,conversion,analytics,seo,lab}`, `scenes/`, `lib/`, `hooks/`, `config/`, `types/`.
- Source de vérité business : `src/config/business.ts` (SEO, JSON-LD, footer, formulaires le consomment).
- Brief client : `input/CLIENT_BRIEF.md` · Assets sources : `input/assets/` → optimisés vers `public/`.

## Commandes

- `pnpm dev` / `pnpm build` / `pnpm start` — serveur (port 3000, `-H 0.0.0.0` pour Codespaces).
- `pnpm check` = **lint + typecheck + test + build** — doit passer avant tout commit significatif.
- `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm test:e2e` · `pnpm test:a11y`.
- `pnpm audit:site` · `pnpm assets:{audit,images,video,models,all}`.
- Skills Claude Code : `/build-site` · `/preview-site` · `/audit-site` · `/finalize-site` · `/ingest-assets`.

## Loi de séparation des animations (non négociable)

- **Motion** : micro-interactions uniquement (hover, press, enter/exit, layout, gestes, parallaxe légère).
- **GSAP + ScrollTrigger** : cinématique au scroll (timelines, sections épinglées, scrub, caméra, séquences).
- **Lenis** : smooth scroll, synchronisé à ScrollTrigger, détruit proprement, **désactivé si reduced-motion**.
- Jamais de librairie pour ce qu'une API native fait mieux. Jamais de scroll-jacking bloquant le CTA.

## 3D (React Three Fiber)

- **Jamais de WebGL en SSR.** Scènes lourdes en `next/dynamic({ ssr: false })`.
- Toujours une **WebGL boundary + fallback** image/vidéo. Aucun contenu ne doit _exiger_ WebGL pour être lisible.
- Tiers **ULTRA / BALANCED / LITE** (détection device + reduced-motion + save-data). DPR adaptatif, cull/pause hors écran.

## Responsive

- Mobile-first, testé aux points de rupture. **CTA sticky mobile** persistant, click-to-call et itinéraire toujours atteignables.

## Accessibilité (obligatoire)

- Navigation clavier complète, focus visible, contrastes WCAG AA, HTML sémantique, `h1` unique.
- **Skip link**, `prefers-reduced-motion` honoré partout, bouton pour passer toute intro, scroll jamais bloqué.
- Alternative à chaque scène 3D (image/vidéo), alt text configurable, sous-titres/transcription pour vidéo parlée.
- Le **CTA est atteignable sans terminer une scène/animation**.

## Performance

- `next/image` + `sizes` explicites, `next/font`, imports dynamiques, code splitting, posters, modèles compressés.
- Dimensions explicites (anti-CLS). Aucun asset de démo lourd committé. Aucune dépendance importée sans usage réel.
- Voir `docs/PERFORMANCE-BUDGET.md`.

## Intégrité du contenu — interdit d'inventer

Ne **jamais** inventer d'infos client : avis, notes, prix, promotions, certifications,
récompenses, résultats, adresses. Utiliser `business.ts` (faits vérifiés uniquement) ;
laisser vide si l'info n'est pas fournie. Marquer les placeholders `[À CONFIRMER]`.

## Sécurité & déploiement

- **pnpm uniquement** ; jamais `--force` ni `--legacy-peer-deps`. React épinglé `<19.3` (sinon R3F casse).
- **Ne jamais committer de secrets** ; `.env*` gitignorés ; `.env.example` sans valeurs. Intégrations tierces **env-gated**, off par défaut.
- **Ne jamais déployer ni pousser vers un service externe sans ordre explicite.** Pas de hook qui déploie/push/supprime/publie ou lit/envoie des secrets.

## Tests (obligatoire)

- Vitest + RTL (comportement, requêtes par rôle) ; Playwright + axe-core (e2e + a11y).
- Couvrir : reduced-motion, fallbacks 3D, validation formulaire (succès/erreur), navigation clavier, contenu sans Canvas.
- **Ne jamais masquer un test qui échoue** ni le remplacer par un test vide. Corriger la cause.

## Définition de « terminé »

`pnpm check` vert (lint + typecheck + test + build) · `/` et `/lab` s'affichent sans erreur console ·
reduced-motion respecté · fallback WebGL vérifié · SEO/JSON-LD valides et cohérents avec le contenu visible ·
aucun secret · aucune info inventée. Voir `docs/DEFINITION-OF-DONE.md`.

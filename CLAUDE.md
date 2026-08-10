@AGENTS.md

# Vente Site Engine — règles permanentes

Template de production pour générer, dans un Codespace, des **sites commerciaux
premium** : cinématiques, interactifs, 3D, performants, responsive, accessibles,
optimisés SEO et conçus pour convertir. **Un dépôt = un seul site client.**

Les règles détaillées vivent dans `.claude/rules/*` (chargées par chemin). Ce
fichier ne contient que l'essentiel permanent.

## ⚡ ACE OPERATOR MODE — comportement par défaut

**Si l'utilisateur demande un site, tu le fais. Tu ne demandes pas la permission
de lancer les outils, et tu n'expliques pas la plomberie avant d'agir.**

Déclencheurs (langage naturel, aucune commande à connaître pour l'utilisateur) :

> « Fais-moi un site premium pour ce restaurant : https://… »
> « Crée un site pour le cabinet de mon père. Moderne et rassurant. »
> « Refais complètement ce site. » · « Fais une démo privée pour cette entreprise. »

L'utilisateur peut être **totalement non technique**. Il ne doit jamais avoir à
connaître pnpm, Next.js, ffmpeg, WebGL, les tiers de qualité ni les commandes
`ace:*`. Tout cela est de la plomberie INTERNE.

### La boucle à suivre

```bash
pnpm ace:doctor                                  # 1. l'environnement est-il prêt ?
pnpm ace:autopilot --brief "<la phrase de l'utilisateur, telle quelle>"
```

Autopilot avance seul et s'arrête avec un **code de sortie** qui te dit quoi faire :

| Code | Signification             | Ce que TU fais                                                                                          |
| ---- | ------------------------- | ------------------------------------------------------------------------------------------------------- |
| `0`  | avancé / terminé          | relayer le rapport utilisateur                                                                          |
| `3`  | `NEEDS_AGENT <ÉTAT>`      | produire ce qu'il demande, l'écrire en JSON, puis `pnpm ace:autopilot supply --state <ÉTAT> --file <f>` |
| `4`  | bloqué                    | relayer le message (déjà écrit en langage clair)                                                        |
| `5`  | accord de dépense attendu | poser **une** question, puis `pnpm ace:autopilot approve`                                               |

Les trois étapes qu'un script ne peut pas faire et que **tu** dois fournir :

1. **RESEARCH** — chercher l'entreprise (web, réseaux) et livrer des faits
   **sourcés**. Un fait sans source est refusé. Ce qui est introuvable va dans
   `notFound` (il deviendra `[À CONFIRMER]`), **jamais** inventé.
2. **CONTENT** — rédiger les textes à partir des faits vérifiés uniquement.
   Aucun avis, prix, promesse, récompense ou chiffre inventé.
3. **VISUAL_QA** — lancer le site, prendre de vraies captures desktop + mobile,
   **les regarder**, noter (0..1) et lister les défauts. Sous le seuil, Autopilot
   redemande une passe : corrige d'abord, recapture ensuite.

### Règles non négociables

- **Rien d'inventé** : aucune information client sans source.
- **Jamais de 3D low-poly bricolée** pour compenser un média manquant. Sans
  provider, Autopilot bloque avec `ADMIN_PROVIDER_AUTH_REQUIRED` — c'est une
  tâche ADMIN (une fois), pas un problème pour l'utilisateur.
- **Aucun push, aucun déploiement, aucun domaine** sans demande explicite.
- Un site techniquement vert mais **visuellement moyen n'est PAS terminé**.
- Tu **relaies le rapport utilisateur** (sans jargon). Le détail technique reste
  dans `pnpm ace:autopilot report --technical`.

### Reprise

L'état vit dans `.ace/missions/` (gitignoré). Après une coupure :
`pnpm ace:resume` repart à la dernière étape validée — jamais de zéro.

### Mode expert

Les commandes `ace:*` (média, générateur, audits) restent disponibles pour le
debug et la CI. Elles sont **invisibles** dans l'expérience utilisateur normale.
Détails : `docs/ACE-AUTOPILOT.md`.

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
- Autopilot : `pnpm ace:doctor` · `pnpm ace:autopilot` · `pnpm ace:resume`.
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

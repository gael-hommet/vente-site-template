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
> « Transforme ces quatre images en visite immersive. » (→ Spatial Cinema)

L'utilisateur peut être **totalement non technique**. Il ne doit jamais avoir à
connaître pnpm, Next.js, ffmpeg, WebGL, les tiers de qualité ni les commandes
`ace:*`. Tout cela est de la plomberie INTERNE.

### La boucle à suivre

```bash
pnpm ace:doctor                                  # 1. l'environnement est-il prêt ?
pnpm ace:autopilot --brief "<la phrase de l'utilisateur, telle quelle>"
```

Autopilot avance seul et s'arrête avec un **code de sortie** qui te dit quoi faire :

| Code | Signification        | Ce que TU fais                                                                                          |
| ---- | -------------------- | ------------------------------------------------------------------------------------------------------- |
| `0`  | avancé / terminé     | relayer le rapport utilisateur                                                                          |
| `3`  | `NEEDS_AGENT <ÉTAT>` | produire ce qu'il demande, l'écrire en JSON, puis `pnpm ace:autopilot supply --state <ÉTAT> --file <f>` |
| `4`  | bloqué               | relayer le message (déjà écrit en langage clair)                                                        |

Les quatre étapes qu'un script ne peut pas faire et que **tu** dois fournir :

1. **RESEARCH** — chercher l'entreprise (web, réseaux) et livrer des faits
   **sourcés**. Un fait sans source est refusé. Ce qui est introuvable va dans
   `notFound` (il deviendra `[À CONFIRMER]`), **jamais** inventé.
2. **ASSET_DISCOVERY** — **CHERCHER D'ABORD** les vrais visuels : site officiel,
   réseaux officiels, sources publiques vérifiables. Les télécharger, puis livrer
   un inventaire où chaque média porte sa **provenance**, sa **nature**
   (`REAL` / `CONCEPTUAL`) et ses **droits**. Ne demander un visuel à
   l'utilisateur QUE si la recherche n'a rien donné.
3. **CONTENT** — rédiger les textes à partir des faits vérifiés uniquement.
   Aucun avis, prix, promesse, récompense ou chiffre inventé.
4. **VISUAL_QA** — prendre de vraies captures desktop, **les regarder**, noter
   (0..1) et lister les défauts. Sous le seuil, Autopilot redemande une passe :
   corrige d'abord, recapture ensuite.

Le contrôle **mobile** est fait par ACE lui-même (capture réelle + mesures) : un
site qui échoue au mobile n'est pas terminé.

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
- Spatial : `pnpm ace:spatial:doctor` · `pnpm ace:spatial:plan` · `pnpm ace:spatial:verify`.
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

## Spatial Cinema (ACE 0.3) — images → espace traversé

Quand l'utilisateur demande une **visite**, une **immersion**, un **parcours dans
un lieu**, ACE choisit **seul** la stratégie — aucun questionnaire technique :

| Matière réellement disponible                     | Mode                                  |
| ------------------------------------------------- | ------------------------------------- |
| un `.glb` / `.gltf`                               | `real-3d`                             |
| plusieurs photos **+ leurs cartes de profondeur** | `hybrid-spatial`                      |
| une photo **+ sa carte de profondeur**            | `depth-scene`                         |
| rien d'exploitable                                | page éditoriale — **aucune promesse** |

`decideSpatialStrategy(inventory)` (`src/ace/autopilot/spatial-decision.ts`) est
appelé à l'étape `ART_DIRECTION`, une fois le matériau réel inventorié.

**La carte de profondeur est obligatoire et n'est JAMAIS inventée.** Absente, la
scène est refusée (`DEPTH_MAP_REQUIRED`) et la page reste éditoriale : mieux vaut
une page honnête qu'un faux relief. Nommage reconnu : `salle.jpg` +
`salle.depth.png` (ou `salle-depth.png`).

**Jamais un diaporama** : ni fondu, ni carrousel, ni remplacement d'image. Le
scroll pilote une **caméra** dans une géométrie réellement déplacée en Z.

Détails : `docs/ACE-SPATIAL-CINEMA.md` · prise de vue :
`docs/ACE-SPATIAL-CAPTURE-GUIDE.md` · contrôle : `docs/ACE-SPATIAL-QA.md`.

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

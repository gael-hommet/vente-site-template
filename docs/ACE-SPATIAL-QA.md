# Contrôle qualité — Spatial Cinema

Une expérience spatiale ne se valide **jamais** sur un build vert. Il faut
**regarder** le rendu. Ce document dit quoi mesurer, quoi refuser, et comment.

---

## 1. Verdicts

| Verdict | Signification |
| --- | --- |
| `REJECT` | un défaut mesurable existe : l'expérience ne part pas |
| `REVIEW_REQUIRED` | rien de mesurable à redire, **mais personne n'a encore regardé** |
| `PASS` | mesures propres **+ revue visuelle réelle** confirmée |

`pnpm ace:spatial:verify` ne peut **pas** délivrer `PASS` : une ligne de commande
ne voit rien. Le maximum atteignable en CLI est `REVIEW_REQUIRED`.
`confirmVisualReview()` est le seul chemin vers `PASS`.

## 2. Motifs de refus mesurables

| Violation | Ce qui la déclenche |
| --- | --- |
| `NO_CAMERA_MOVEMENT` | la caméra ne bouge pas — c'est un diaporama |
| `FLAT_TEXTURE` | relief nul : un plan plat texturé |
| `CROSSFADE_ONLY` | raccord non spatial |
| `HARD_CUT` | raccord absent ou trop bref |
| `DISCONTINUOUS_DIRECTION` | la caméra pivote de plus de 45° au raccord |
| `EXCESSIVE_PARALLAX` | amplitude > 2,2 : le maillage va se trouer |
| `BROKEN_TIMELINE` | trou, inversion ou bornes incohérentes |
| `DEPTH_MAP_MISSING` | profondeur absente : la scène ne peut pas être spatiale |

## 3. Motifs de refus visuels (il faut regarder)

- Un **diaporama** déguisé, ou un **fondu dominant** visible.
- Une **texture plate** sans perspective.
- Un **déchirement**, un **trou** de maillage, une déformation grotesque de
  l'architecture.
- Un **bord vide** qui apparaît (le plan ne couvre plus le cadre).
- Un raccord où **les deux images sont clairement visibles ensemble**.
- Un **saut** de caméra, un **horizon discontinu**.
- Du WebGL techniquement présent mais dont l'effet est **pratiquement nul**.

## 4. Preuve anti-diaporama (automatisée)

`tests/unit/spatial-cinema.test.ts` échoue si l'implémentation dégénère en
`image = round(progress * n)` ou en simple fondu. Elle vérifie notamment :

- la position caméra change **en continu** (aucun palier figé), sans saut ;
- le trajet est **parfaitement réversible** (écart < 1e-9) ;
- la **source du shader** contient bien l'échantillonnage de la profondeur et le
  déplacement des sommets, sur une géométrie **subdivisée** ;
- la caméra passe d'une scène à l'autre **sans saut de position** ;
- le plan **couvre le cadre** de 0,46 à 2,4 de rapport d'écran ;
- partout où deux scènes coexistent, l'écran est **masqué à plus de 70 %** ;
- un manifeste « diaporama » est bien **REJETÉ**.

## 5. Contrôle navigateur réel (obligatoire)

Captures à **0 · 15 · 28 · 40 · 48 · 62 · 80 · 95 %** de progression, **desktop
et mobile**. Le pilotage se fait sur la **progression réelle**, pas sur une
fraction de page : la section épinglée ne se déplace pas linéairement avec le
scroll.

Lire l'état par le canal `window.__spatialCam` (`?spatialDebug=1`) : il est écrit
**dans la boucle de rendu**, donc fiable même à très bas framerate — contrairement
au DOM, qui dépend d'un commit React.

À vérifier sur les captures :

- un `<canvas>` est présent et **aucun `<img>`** ne le remplace ;
- la position caméra **change** d'un point à l'autre et la profondeur est visible
  (lignes courbées, parallaxe entre plans) ;
- le cadre est **entièrement couvert** ;
- aucune erreur console.

> Sous rendu logiciel (`--use-gl=swiftshader`), la page tourne à quelques images
> par seconde. Figez la qualité (`?spatialTier=`) et supprimez l'inertie du scrub
> (`?spatialScrub=0`) pour capturer un point précis — ces deux paramètres sont
> réservés au banc d'essai.

## 6. Repli et accessibilité

- `prefers-reduced-motion` : aucun mouvement spatial, image stable, contenu et
  CTA lisibles, **hauteur de page normale** (pas de scroll confisqué).
- Sans WebGL : poster affiché par `WebGLBoundary`.
- GPU lent : la qualité **baisse** (maillage, DPR) avant tout repli ; le repli
  éditorial est le dernier cran, pas le premier réflexe.

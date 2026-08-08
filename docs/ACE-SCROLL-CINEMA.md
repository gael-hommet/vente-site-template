# ACE 0.2 — Scroll Cinema (intégration runtime)

Document **interne au moteur** (élagué à la génération ; le composant runtime,
lui, reste shippé). Décrit comment un média décidé/planifié par le media-engine
s'intègre en **scroll-cinéma** premium, générique et accessible.

## Le composant — `src/components/media/CinematicScroll.tsx`

Orchestrateur **générique** monté au-dessus des composants EXISTANTS :

- `ScrollVideo` — scroll-scrub d'une vraie vidéo continue (stratégie `video-scroll`).
- `ScrollImageSequence` — scrub frame-perfect d'une séquence webp (`image-sequence`).
- `MediaFallback` — poster premium (toutes les autres stratégies + reduced-motion).

Il n'est **jamais** codé pour un site précis : il reçoit la `strategy` retenue
par le media-engine et monte la bonne technique.

```tsx
<CinematicScroll
  strategy="video-scroll" // décidée par chooseStrategy()
  sources={[{ src: "/tour.webm", type: "video/webm" }]}
  poster="/tour-poster.jpg"
  alt="Visite du lieu"
  chapters={[
    { at: 0, title: "Entrée" },
    { at: 0.5, title: "Séjour" },
  ]}
  cta={<a href="/contact">Prendre rendez-vous</a>}
/>
```

Props (union discriminée par `strategy`) :

| strategy                                           | données requises        | rendu                         |
| -------------------------------------------------- | ----------------------- | ----------------------------- |
| `video-scroll`                                     | `sources: {src,type}[]` | `ScrollVideo` (scrub)         |
| `image-sequence`                                   | `frames: string[]`      | `ScrollImageSequence` (scrub) |
| `2.5d` / `webgl` / `hybrid` / `editorial-fallback` | (aucune)                | `MediaFallback` poster        |

`CINEMATIC_SCROLL_STRATEGIES = ["video-scroll", "image-sequence"]` : les seules
stratégies réellement **orchestrées** par ce wrapper (les autres → poster).

## Correspondance stratégie → technique

`chooseStrategy()` décide, `CinematicScroll` (ou d'autres surfaces runtime) rend :

| Stratégie            | Décidée quand…                                 | Rendu runtime                         |
| -------------------- | ---------------------------------------------- | ------------------------------------- |
| `video-scroll`       | vraie vidéo continue + intention de continuité | `ScrollVideo`                         |
| `image-sequence`     | séquence de frames (ou vidéo à extraire)       | `ScrollImageSequence`                 |
| `webgl`              | **vrai** modèle 3D présent (anti-low-poly OK)  | `AdaptiveCanvas` (hors de ce wrapper) |
| `2.5d`               | images fixes premium (barre non-photoréaliste) | `DepthParallax`/`LayeredPhoto`        |
| `hybrid`             | barre haute + provider configuré               | génération puis assemblage            |
| `editorial-fallback` | rien d'exploitable / repli assumé              | poster + composition premium          |

> `webgl` passe par `AdaptiveCanvas` (tiers ULTRA/BALANCED/LITE + fallback +
> gestion de perte de contexte) **avec un vrai modèle glTF** — jamais par ce
> wrapper, qui ne rend aucune 3D (anti-low-poly).

## Accessibilité & anti scroll-jacking (non négociables)

- **Reduced-motion** : `CinematicScroll` détecte `useReducedMotion()` et rend un
  **poster statique** (+ overlays lisibles). Aucune animation forcée.
- **Contenu lisible sans média** : le poster porte un `alt` ; les chapitres et le
  CTA restent du DOM standard atteignable au clavier.
- **CTA toujours atteignable** sans terminer la scène (overlay `pointer-events`
  ciblé, jamais de capture globale du scroll).
- **Aucune 3D cheap** : les stratégies non vidéo/frames retombent sur le poster.

## Overlays (chapitres + CTA)

`CinemaOverlay` superpose une liste de chapitres (liquid glass) et un CTA
persistant, **non bloquants** (`pointer-events-none` sur le conteneur, réactivé
seulement sur les éléments interactifs). Les chapitres affichent leur position
`at` (0..1) ; ils n'interceptent jamais le défilement.

## Loi de séparation des animations

Conforme à la règle permanente du dépôt :

- Le **scrub au scroll** (video/frames) est piloté par **GSAP + ScrollTrigger**
  (dans `ScrollVideo`/`ScrollImageSequence`), synchronisé à **Lenis**, désactivé
  sous reduced-motion.
- **Motion** reste cantonné aux micro-interactions (overlays, CTA).
- Ce wrapper n'introduit aucune boucle RAF concurrente : il délègue aux
  composants existants qui gèrent déjà cleanup et `ScrollTrigger`.

## Tests — `tests/unit/cinematic-scroll.test.tsx`

- Sous reduced-motion : poster + chapitres présents (aucune 3D).
- Stratégie non-vidéo (`webgl`) : repli poster, **aucun `<canvas>`**.
- CTA de l'overlay atteignable (lien avec `href`).
- `CINEMATIC_SCROLL_STRATEGIES` expose bien `video-scroll`/`image-sequence`, pas
  `webgl`.

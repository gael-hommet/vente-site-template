# Audit de réintégration — enseignements du site témoin → moteur ACE

> 2026-07-18. Le premier site témoin (`/workspaces/inquarto`, IN QUARTO) a servi
> de crash-test. Ce document trace les défauts **génériques** découverts pendant
> sa construction/finalisation et **backportés dans le moteur**, en excluant
> strictement toute identité visible du client.

## Méthode

Diff fichier par fichier des composants **partagés** (générés depuis ce moteur)
entre le témoin et le moteur ; seules les améliorations sans saveur client sont
remontées. L'esthétique IN QUARTO (palette Chaux, Fraunces, hachures, cartouches,
planches d'élévation, coupe, maquette, routes, textes, 21 projets) **reste dans
le dépôt client** et n'entre jamais dans le moteur.

## Backporté dans le moteur (générique)

| Fichier moteur                                   | Amélioration                                                                | Pourquoi générique                                                                                                 |
| ------------------------------------------------ | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `src/lib/three/webgl.ts`                         | `detectWebGL` ne met en cache que les **positifs**                          | Un faux négatif transitoire (GPU pas prêt au 1er paint) figeait toute session en LITE, sur n'importe quel site 3D. |
| `src/components/three/DeviceQualityProvider.tsx` | Re-détection après le 1er frame (rAF)                                       | Récupère le vrai tier si le probe initial était négatif — bénéficie à toute scène WebGL.                           |
| `src/components/three/ThreeCanvas.tsx`           | Garde `webglcontextlost`/`restored` (`preventDefault` + invalidate)         | Sans `preventDefault`, le navigateur ne restaure jamais le contexte → scène figée. Concerne tout Canvas du moteur. |
| `src/components/ui/field.tsx`                    | Contrôles `text-base sm:text-sm` (≥16px sous sm)                            | Supprime le zoom auto d'iOS Safari au focus — tout formulaire du moteur.                                           |
| `src/components/conversion/ctas.tsx`             | `CallCTA` : `aria-label` de repli (variante icône seule)                    | La barre CTA sticky mobile utilise le click-to-call en icône seule → nom accessible garanti (WCAG).                |
| `src/components/conversion/form-parts.tsx`       | `FormSuccess` prend le focus au montage (`tabIndex`/ref)                    | Après envoi, le formulaire est démonté ; le focus ne doit pas retomber sur `<body>` — tout formulaire.             |
| `src/app/layout.tsx`                             | `pb` mobile réservant la hauteur de la `StickyMobileCTA` fixe (+ safe-area) | La barre fixe recouvrait le bas du footer sur mobile — starter et tout site généré.                                |
| `src/app/manifest.ts`                            | Couleurs neutres claires par défaut (plus de noir froid)                    | Cohérence avec le thème clair neutre par défaut du moteur.                                                         |
| `tests/unit/setup.ts`                            | Polyfill jsdom `getTotalLength`                                             | Permet de monter en test tout composant à animation de tracé SVG (dash-offset).                                    |
| `tests/unit/webgl-detect.test.ts`                | **Nouveau** test : cache des positifs seulement                             | Verrouille l'amélioration `detectWebGL` contre régression.                                                         |

## NON backporté (spécifique client, resté dans le témoin)

`ProjectPlate` (planches d'élévation), `Cartouche`/`Cotation`/`BioclimaticCut`
(vocabulaire architectural), `HeroIntro` (anti-flash sur le hero IN QUARTO),
preset `inquarto`, palette Chaux/Garrigue, fontes Fraunces/Archivo/Plex,
contenus, routes `/projets|/approche|/agence`, corrections de hiérarchie de
titres propres aux pages client, folios, numérotations. Ces éléments démontrent
ce qu'ACE **peut** produire, sans jamais être imposés par le moteur.

## Vérification

`pnpm check` moteur **vert** (lint + typecheck + 86 + 2 tests + build). Les
correctifs sont additifs et sans dépendance à une identité. Une régénération de
site témoin (`pnpm ace:new-site`) peut confirmer la non-régression de bout en
bout si besoin. Aucun push.

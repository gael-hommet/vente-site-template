# Plan de backport — témoin → moteur

> État des remontées du site témoin vers le moteur. Distingue ce qui EST un
> backport de fichier (fait) de ce qui est une lacune STRUCTURELLE (à construire,
> jamais copiée depuis le client).

## A. Backports de fichiers — FAITS

Voir `REINTEGRATION-AUDIT.md` (commit moteur). Tous génériques, testés vert :

| Fichier                                                                        | Statut |
| ------------------------------------------------------------------------------ | ------ |
| `src/lib/three/webgl.ts` (cache positifs) + `tests/unit/webgl-detect.test.ts`  | ✅     |
| `src/components/three/DeviceQualityProvider.tsx` (rAF re-detect)               | ✅     |
| `src/components/three/ThreeCanvas.tsx` (contextlost/restored)                  | ✅     |
| `src/components/ui/field.tsx` (16px anti-zoom iOS)                             | ✅     |
| `src/components/conversion/ctas.tsx` (CallCTA aria-label)                      | ✅     |
| `src/components/conversion/form-parts.tsx` (FormSuccess focus)                 | ✅     |
| `src/app/layout.tsx` (spacer StickyMobileCTA) · `src/app/manifest.ts` (neutre) | ✅     |
| `tests/unit/setup.ts` (polyfill getTotalLength)                                | ✅     |

## B. NON backporté (spécifique client — reste dans le témoin)

Ne JAMAIS remonter au moteur : `ProjectPlate`, `Cartouche`, `Cotation`,
`BioclimaticCut`, `HeroIntro` (version Site témoin A), preset `temoin-a`, palette
Chaux/Garrigue, fontes Fraunces/Archivo/Plex, contenus, routes d'architecte,
folios, corrections de hiérarchie propres aux pages client. Ces éléments sont des
**démonstrations** de ce qu'ACE peut produire, pas des primitives du moteur.

## C. Lacunes structurelles — À CONSTRUIRE (pas un backport)

Ce ne sont pas des fichiers à copier depuis Site témoin A : ce sont des systèmes
**génériques neufs** à écrire dans le moteur.

| Système                  | Livrable                                                                                 | Phase |
| ------------------------ | ---------------------------------------------------------------------------------------- | ----- |
| Contrat client universel | `src/ace/config/{client-schema,client-defaults,client-loader,features,types}.ts` + tests | 2     |
| Recipes composables      | `src/ace/recipes/{heroes,navigation,projects,storytelling,conversion,...}` + registres   | 3     |
| DA élargie               | axes typo/densité/grille/matières variables + presets de validation neutres              | 4     |
| Générateur config-aware  | `--config/--brief/--assets`, activation features/routes, quality gates                   | 5     |
| Studio                   | ACE Lab → banc d'essai des recipes/tokens/tiers                                          | 6     |
| Validations opposées     | `ace-validation-editorial` + `ace-validation-immersive`                                  | 7     |
| Preuve anti-template     | `docs/ACE-ANTI-TEMPLATE-VALIDATION.md`                                                   | 8     |

## D. Règle de tri (à chaque remontée future)

Un élément remonte au moteur **uniquement si** : il est utile à ≥2 secteurs, ne
contient aucune identité client, est configurable/typé, accessible, responsive,
reduced-motion-safe, testable. Sinon il reste dans le dépôt client.

# Enseignements du pilote — Site témoin A → ACE

> Le premier site témoin (Site témoin A, `<dépôt local du site témoin>`, figé) a servi de
> crash-test. Ce document résume ce qu'il a appris au moteur, au-delà des
> correctifs de fichiers déjà backportés (`REINTEGRATION-AUDIT.md`).

## 1. Ce que le pilote a prouvé

- ACE peut produire une expérience client premium **complète** (home cinématique,
  collections SSG, scène R3F lazy gatée par tier, formulaire, SEO/JSON-LD, a11y,
  reduced-motion, mobile) sans reconstruire les fondations.
- La chaîne **détection tier → AdaptiveCanvas → fallback obligatoire** tient en
  conditions réelles (GL logiciel headless compris).
- Le générateur `git archive` + contrôle de fuite empêche par construction toute
  fuite de secret/identité étrangère.

## 2. Défauts GÉNÉRIQUES révélés (corrigés + backportés)

Voir `REINTEGRATION-AUDIT.md` : détection WebGL (cache positifs + rAF), garde de
perte de contexte, champs 16px (anti-zoom iOS), nom accessible du click-to-call,
focus au succès de formulaire, espace réservé sous la barre CTA sticky, manifest
neutre, polyfill jsdom `getTotalLength`.

## 3. Lacunes STRUCTURELLES révélées (le vrai travail restant)

Le pilote a montré que, pour générer un **nouveau** client rapidement, il a fallu
écrire à la main beaucoup de choses qui devraient être **paramétrées** :

1. **Configuration client ad-hoc.** `src/config/{business,site,content,navigation}.ts`
   sont des objets TS non validés. Il manque un **contrat client universel typé
   et validé (Zod)** couvrant identité, industrie, audience, objectifs, pages,
   collections, équipe, formulaire, SEO, analytics, langues, DA, intensités
   Motion/WebGL, feature flags. → **Phase 2**.
2. **Pas de recipes.** Les registres Motion (9) et Scene (3) existent, mais il
   n'y a **aucune recette composable** pour heroes / navigation / collections /
   storytelling / conversion. Chaque page a été écrite sur mesure pour Site témoin A.
   Un second client repartirait de zéro visuellement. → **Phase 3**.
3. **Pas de feature flags.** Activer/désactiver 3D, smooth-scroll, formulaire,
   collections, langues devrait être déclaratif. → **Phase 2 (`features.ts`)**.
4. **Générateur limité.** `--name/--out/--preset/--url` seulement ; il n'ingère
   pas `--config/--brief/--assets`, n'active pas de features ni de routes selon
   la config. → **Phase 5**.
5. **Risque de mono-esthétique.** Sans recipes + DA réellement variables, deux
   clients se ressembleraient. Le moteur doit être prouvé **anti-template** par
   deux validations opposées. → **Phases 7–8**.

## 4. Invariant

La seule signature partagée entre sites ACE est la **qualité** (perf, a11y,
fluidité, fiabilité) — jamais le design visible. Toute contrainte esthétique
héritée d'Site témoin A trouvée dans le moteur est un bug à abstraire ou supprimer.

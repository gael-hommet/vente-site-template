---
description: Loi de séparation des animations Motion / GSAP+ScrollTrigger / Lenis et règles anti scroll-jacking.
globs: src/components/motion/**,src/lib/animation/**,src/scenes/**
---

# Animation (Motion / GSAP / Lenis)

## Loi de séparation (non négociable)
- **Motion** : micro-interactions uniquement — hover, press, focus, enter/exit, `layout`, gestes. Rien de cinématique lié au scroll.
- **GSAP + ScrollTrigger** : timelines cinématiques, sections pinnées, scrub, contrôle de caméra et de séquences. C'est le seul outil pour le storytelling au scroll.
- **Lenis** : smooth scroll, synchronisé avec ScrollTrigger. Détruit proprement au démontage (`lenis.destroy()`), et **désactivé** si `prefers-reduced-motion: reduce`.
- Ne jamais utiliser une librairie pour ce qu'une API native fait mieux (ex. pas de JS pour une transition CSS simple).

## Synchronisation
- Un seul pilote de scroll : brancher Lenis dans le ticker GSAP et appeler `ScrollTrigger.update()` sur l'événement Lenis. Pas de double boucle RAF concurrente.
- Nettoyer chaque animation : `gsap.context()` / `ScrollTrigger.kill()` / cleanup du `useEffect`. Aucune animation ni trigger orphelin après démontage.
- `ScrollTrigger.refresh()` après changements de layout/chargement d'assets impactant les hauteurs.

## Reduced motion
- Honorer `prefers-reduced-motion: reduce` : couper Lenis, remplacer les timelines par un état final statique, réduire ou supprimer les transitions non essentielles.
- Fournir une expérience complète et lisible sans aucune animation.

## Anti scroll-jacking
- Ne jamais bloquer la navigation ni le CTA avec le scroll. L'utilisateur doit toujours pouvoir avancer dans la page.
- Pas de capture totale du scroll qui empêche d'atteindre le contenu ou le formulaire.
- Toute intro/séquence longue doit être passable via un bouton "Passer".
- Pas de `preventDefault` global sur `wheel`/`touchmove` qui casse le défilement natif.

## Performance des animations
- Animer `transform` et `opacity` en priorité ; éviter d'animer des propriétés déclenchant layout/paint.
- Nettoyer `will-change` après usage. Pauser les animations hors viewport.

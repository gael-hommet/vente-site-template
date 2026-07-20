# MOTION-AUDIT — Animation (Motion / GSAP / Lenis)

> Audit ACE · 2026-07-17

## 1. Conformité à la loi de séparation — vérifiée

- **GSAP** : `src/lib/animation/gsap.ts` enregistre **uniquement ScrollTrigger** (plugin gratuit), une seule fois, client-side. Aucun plugin premium ; `SplitTextFallback` fournit l'alternative sans dépendance.
- **Lenis** : `SmoothScrollProvider` — piloté par le **ticker GSAP** (`gsap.ticker.add`, `lagSmoothing(0)`), `lenis.on("scroll", ScrollTrigger.update)` → une seule boucle RAF, pas de désync. `lenis.destroy()` + retrait du ticker au démontage. **Retour anticipé si reduced-motion** : scroll natif intact, et `scrollTo` a un repli natif accessible (`scrollIntoView` behavior auto).
- **Motion** : réservé aux micro-interactions (Reveal, MagneticButton, hover/press) — pas de cinématique scroll en Motion constaté.
- Composants scroll cinématiques : ScrollScene, PinnedSequence, ParallaxLayer, ChapterTimeline, ScrollProgress (GSAP/ScrollTrigger) ; media scrub : ScrollVideo, ScrollImageSequence.

## 2. Reduced motion — défense en profondeur

1. CSS global (globals.css) : toutes animations/transitions ~0ms.
2. Hook `useReducedMotion` + `lib/accessibility/reduced-motion.ts` consommés par Lenis, tiers de qualité (`pickTier` → LITE), scènes.
3. Testé : test unitaire reduced-motion + spec e2e dédiée.

## 3. Écarts pour ACE

| Constat                                                                                                        | Recommandation                                                                                                                         |
| -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Pas de « Motion Library » nommée : les recettes (durées, easings, choreographies) vivent dans chaque composant | Étape 12 : catalogue de motions nommés (ex. `reveal.soft`, `pin.chapter`) construit sur les tokens `--duration-*`/`--ease-*` existants |
| `config/motion.ts` existe mais reste minimal                                                                   | L'étoffer comme point d'entrée unique des réglages motion par site                                                                     |
| Pas de garde-fou automatisé anti scroll-jacking (règle projet : CTA toujours atteignable)                      | Spec e2e dédiée « CTA atteignable pendant les pins » à ajouter avec les premières vraies séquences                                     |

## 4. Verdict

Implémentation motion **conforme aux règles projet et propre** (cleanup,
sync, reduced-motion). Rien à corriger ; industrialiser en bibliothèque nommée.

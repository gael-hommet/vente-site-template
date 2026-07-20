# ACCESSIBILITY-AUDIT — Accessibilité

> Audit ACE · 2026-07-17

## 1. Conformités vérifiées dans le code

- **Skip link** : `SkipLink targetId="main"` en tête de layout, `.skip-link` visible au focus ; `<main id="main">` sémantique ; `lang="fr"` ; hiérarchie header/main/footer.
- **Focus** : `:focus-visible` global (outline 2px `--ring`, offset, radius) — jamais supprimé sans remplacement.
- **Reduced motion** : triple couche (CSS global ~0ms, hooks JS, Lenis désactivé avec repli natif) ; tier LITE forcé → pas de WebGL animé ; testé en unit et e2e.
- **WebGL non requis** : fallback avec `alt` requis par le typage (`WebGLBoundary`/`AdaptiveCanvas`) ; contenu critique rendu serveur, lisible sans Canvas (test `home-content` + spec e2e).
- **Formulaires** : `field.tsx` lie label/erreur, `aria-invalid`, focus géré ; états succès/erreur explicites ; testés (contact-form, forms-schemas, spec e2e forms).
- **Dialog/Drawer** : Radix (focus trap, aria, échappement clavier).
- **Contrastes** : palette oklch conçue AA (fond/texte L≈0.99/0.17 clair, 0.16/0.96 sombre) ; axe-core en e2e pour le filet objectif.
- **Audit automatisé** : `tests/e2e/a11y.spec.ts` (@axe-core/playwright) — exécutable désormais (chromium installé 2026-07-17).

## 2. Points de vigilance pour la suite

| Constat                                                                                          | Recommandation                                                                                     |
| ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Pas encore d'intro cinématique réelle → le bouton « Passer l'intro » n'existe que comme règle    | L'imposer dans le contrat de la Motion/Scene Library : toute séquence > durée seuil expose un skip |
| CTA-atteignable-pendant-pin non testé automatiquement                                            | Spec e2e à ajouter dès les premières sections épinglées réelles                                    |
| Sous-titres/transcription vidéo : outillé (règles + pipeline) mais aucun média parlant à ce jour | Vérifier au premier asset vidéo client                                                             |

## 3. Verdict

L'accessibilité est intégrée par construction (typage, providers, tests), pas
plaquée. Aucun défaut bloquant ; les vigilances ci-dessus deviennent des
critères de l'ACE Score.

---
description: Exigences d'accessibilité (clavier, focus, contraste, sémantique, reduced-motion, alternatives à la 3D).
---

# Accessibilité (a11y)

## Navigation et focus
- Navigation clavier complète : tous les éléments interactifs atteignables et actionnables au clavier, dans un ordre logique.
- Focus visible et lisible sur chaque élément focusable ; ne jamais supprimer l'outline sans remplacement équivalent.
- Fournir un **skip link** ("Aller au contenu") en tête de page.

## Structure et contenu
- HTML sémantique : `header`/`nav`/`main`/`section`/`footer`, hiérarchie de titres cohérente (`h1` unique par page).
- Le contenu doit être **lisible sans Canvas/WebGL** : l'information ne dépend jamais du rendu 3D.
- Contraste des textes et éléments UI conforme (WCAG AA au minimum).

## Animations et intro
- Honorer `prefers-reduced-motion: reduce` sur toutes les animations (Motion, GSAP, Lenis, 3D).
- Fournir un bouton pour **passer toute intro/séquence**.
- **Ne jamais bloquer le scroll** ; l'utilisateur garde le contrôle.

## Médias et alternatives
- Alternative à chaque scène 3D (image/vidéo) ; texte alternatif **configurable**.
- Vidéos avec voix : sous-titres/légendes et transcription.
- Images informatives avec `alt` pertinent ; images décoratives en `alt=""`.

## Conversion accessible
- Le **CTA est atteignable sans avoir à terminer une scène** ou une animation.
- Formulaires : labels associés, messages d'erreur liés aux champs, focus géré sur erreur/succès.

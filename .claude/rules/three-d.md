---
description: Règles React Three Fiber — pas de SSR WebGL, fallbacks obligatoires, tiers de qualité, culling/LOD/instancing.
globs: src/components/three/**,src/lib/three/**,src/scenes/**
---

# 3D / WebGL (React Three Fiber)

## SSR et chargement

- **Jamais de WebGL en SSR.** Les scènes R3F sont importées dynamiquement (`next/dynamic`, `ssr: false`).
- Dynamic-import des scènes lourdes ; ne pas les inclure dans le bundle initial.
- Charger les scènes de manière paresseuse (au scroll/à l'entrée dans le viewport) plutôt qu'au boot.

## Frontière WebGL et fallbacks

- Toujours une **WebGL boundary** : détecter l'absence/échec de WebGL et afficher un fallback image/vidéo.
- Aucun contenu du site ne doit **exiger** WebGL pour être lisible. Le message, l'offre, les coordonnées et le CTA restent accessibles sans Canvas.
- Fournir une alternative (poster/vidéo/image) pour chaque scène.

## Tiers de qualité

- Trois tiers : `ULTRA`, `BALANCED`, `LITE`. Détecter les capacités (device, taille écran, perf) et choisir le tier.
- Réduire la qualité sur mobile (moins de post-processing, DPR plus bas, géométrie simplifiée).
- **DPR adaptatif** : clamp `dpr` (ex. `[1, 2]`) et l'abaisser sous contrainte de perf.

## Optimisation de scène

- Pauser et culler ce qui est hors écran ; couper le render loop quand le Canvas n'est pas visible (`frameloop="demand"` si possible).
- Utiliser LOD et instancing (`InstancedMesh`) pour les objets répétés.
- Pas de textures géantes : compresser (KTX2/basis), dimensionner selon l'usage réel.
- Modèles glTF compressés (Draco/meshopt) ; disposer géométries/matériaux/textures au démontage.
- Limiter les draw calls, les lumières dynamiques et les ombres coûteuses.

## Accessibilité et reduced motion

- Respecter `prefers-reduced-motion` : figer/désactiver l'animation de scène, proposer le fallback statique.
- Texte alternatif configurable pour la scène/le fallback.

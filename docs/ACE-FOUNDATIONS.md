# ACE Foundations — la couche moteur `src/ace/`

> 2026-07-17 · ACE v0.1.0 · Architecture Option B (`docs/ACE-ARCHITECTURE-DECISION.md`)
> Validation vivante : la page **`/ace-lab`** (noindex) rend les registres réels.

## Principe

`src/ace/` est **additif** : aucun composant vérifié n'a été déplacé. Les
implémentations restent dans `src/components|lib|hooks|scenes` ; ACE ajoute
au-dessus l'**identité**, le **vocabulaire** (registres à ids stables) et les
**contrats typés** qui rendent les règles maison incontournables à la
compilation.

## Modules

| Module        | Chemin              | Rôle                                                                                                                                                                                                                 |
| ------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ace-core      | `src/ace/core`      | `ACE_VERSION`/`ACE_MODULES`, `createRegistry()` générique (ids uniques, fail-fast), contrats partagés (`AnimationEngine`, `ReducedMotionPolicy`, `TierAware`, `Skippable`, `RequiresFallback`)                       |
| ace-config    | `src/ace/config`    | **Design Language** : schéma zod `designLanguageSchema`, presets `neutral`/`onyx`/`atelier`, `presetToCss()` (light + dark explicite + dark système), `<DesignLanguageStyle preset/>` à monter dans le layout racine |
| ace-ui        | `src/ace/ui`        | Façade des primitives `components/ui` + `cn()` — tout consomme les tokens, donc tout se rethème par preset                                                                                                           |
| ace-motion    | `src/ace/motion`    | Orchestration centralisée (re-export : `registerGsap`, `SmoothScrollProvider`, tokens `DURATION/EASE`) + **Motion Library** : 9 recettes nommées (`reveal.soft`, `pin.sequence`, …)                                  |
| ace-scenes    | `src/ace/scenes`    | Chaîne WebGL adaptative (re-export `AdaptiveCanvas`/`WebGLBoundary`/`QUALITY_BUDGETS`) + **Scene Library** : 3 scènes démo sous contrat                                                                              |
| ace-media     | `src/ace/media`     | Schémas zod anti-CLS : dimensions obligatoires, poster vidéo obligatoire, `validateVideoAsset` refuse une vidéo parlée sans sous-titres                                                                              |
| ace-content   | `src/ace/content`   | `ContentValue<T>` vérifié / à-confirmer : un brouillon ne peut pas s'imprimer sans la marque `[À CONFIRMER]`                                                                                                         |
| ace-seo       | `src/ace/seo`       | Façade metadata + JSON-LD, tout dérivé de `business.ts`                                                                                                                                                              |
| ace-forms     | `src/ace/forms`     | Schémas zod partagés + `submitForm` + contrat `LeadAdapterContract` env-gated (deliver reste `server-only`, non ré-exporté)                                                                                          |
| ace-analytics | `src/ace/analytics` | `track()` typé, fournisseurs env-gated, set d'événements fermé                                                                                                                                                       |
| ace-testing   | `src/ace/testing`   | **Test-only** : `mockReducedMotion`, `mockMatchMedia`, `makeDeviceProfile`, `__setWebGLForTesting`                                                                                                                   |

## Contrats — les règles devenues types

- **Loi de séparation animation** : `MotionRecipe` est une union discriminée — `engine: "gsap"` force `intent: "cinematic"` **et** `skippable: true` (littéral) ; `engine: "motion"|"css"` force `intent: "micro"`. Déclarer une recette GSAP non passable ne compile pas.
- **Fallback obligatoire** : `SceneDefinition extends RequiresFallback` — pas de scène sans `fallback.alt` significatif ; test unitaire vérifie en plus poster/vidéo présent.
- **Reduced motion** : chaque recette déclare sa politique (`final-state` / `disabled` / `static-fallback`).
- **Tiers** : chaque scène déclare `minTier` ; en dessous, `AdaptiveCanvas` montre le fallback (LITE ne boote jamais WebGL).
- **Registres légers** : les loaders sont des `import()` dynamiques — lister les registres (ACE Lab, futur générateur) n'importe ni three.js ni GSAP.

## Design Language — usage

```tsx
// src/app/layout.tsx (site client, à la génération) :
import { DesignLanguageStyle } from "@/ace/config/DesignLanguageStyle";
<DesignLanguageStyle preset="onyx" />; // "neutral" → aucun style émis (no-op)
```

Un preset ne peut surcharger **que** des tokens déjà déclarés par
`globals.css` (`--brand-*`, `--ring`, `--shadow-glow`, `--radius-*`) — testé.
Le choix de police est une recommandation de preset appliquée à la génération
(`next/font` = build-time), pas au runtime.

## Tests

5 suites ACE (25 tests) : registre générique, presets/resolver, loi de
séparation + skippable, fallbacks de scènes, contenu/médias. E2E :
`tests/e2e/ace-lab.spec.ts`. Total projet : 72 tests unitaires + 6 specs e2e.

## Vérification navigateur (2026-07-17)

Suite e2e chromium complète : **13/13 verts** (dont axe-core sur `/` et `/lab`)
contre le build de production. Défauts réels détectés par cette passe et
corrigés dans le moteur :

1. **Contrastes AA (axe)** — tokens clairs trop faibles : `--muted` 0.55→0.53,
   `--brand` 0.62→0.54, `--brand-strong` 0.52→0.46 ; badge `text-brand`→
   `text-brand-strong` ; trio sémantique `--success/--danger/--warning`
   assombri en clair + variantes claires ajoutées aux deux blocs sombres
   (il n'en existait qu'une valeur, illisible sur fond clair).
2. **`aria-prohibited-attr`** — `SplitTextFallback` posait `aria-label` sur un
   `<span>` sans rôle ; remplacé par le pattern `.sr-only` + fragments
   `aria-hidden`.
3. **CTA recouvert (grave)** — parent flex ⇒ ScrollTrigger désactivait
   silencieusement `pinSpacing`, la scène épinglée (SceneToMapTransition)
   recouvrait le formulaire situé dessous sur toute sa plage de scroll.
   `useScrubProgress` force désormais `pinSpacing: true` par défaut
   (option explicite pour les overlays volontaires).
4. Specs e2e héritées jamais exécutées (browsers absents avant ce jour) :
   sélecteurs ambigus corrigés ; budgets de temps élargis pour `/lab`
   (MapLibre sur GL logiciel en headless bloque le thread plusieurs secondes —
   artefact d'environnement, pas défaut device réel).

## Prochaines phases

Starter neutre (phase 2) → enrichissement `/ace-lab` interactif (phase 3) →
générateur `ace:new-site` (phase 4) qui consommera `DESIGN_PRESETS`,
`MOTION_RECIPES` et `SCENES` comme vocabulaire de composition.

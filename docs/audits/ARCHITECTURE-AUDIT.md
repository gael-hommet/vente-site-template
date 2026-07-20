# ARCHITECTURE-AUDIT — Structure applicative

> Audit ACE · 2026-07-17

## 1. Modèle actuel

Application unique App Router. Séparation nette en couches :

- **`config/`** — vérité métier (`business.ts`), site (`site.ts`, env-driven), navigation, motion. `business.ts` est consommé par SEO/JSON-LD/footer/formulaires ; le placeholder par défaut est honnête (aucune donnée inventée, champs omis).
- **`lib/`** — logique pure, sans JSX : gsap central (`registerGsap()` n'enregistre que ScrollTrigger, une fois, client-side), détection WebGL, tiers de qualité (`pickTier` pur et testable + `QUALITY_BUDGETS` par tier), SEO (metadata + jsonld dérivés de config), forms (schémas zod partagés client/serveur, `deliver.ts` `server-only` env-gated avec simulation locale), analytics env-gated, loader d'intégrations optionnelles.
- **`components/`** — 12 familles par domaine (ui, layout, motion, three, media, photo, maps, conversion, effects, analytics, seo, lab). Un composant par fichier, index barrels par famille.
- **`scenes/`** — scènes R3F de démonstration, une par dossier.
- **`hooks/`** — accès React aux capacités (useQuality, useReducedMotion…).

## 2. Points forts vérifiés

- **Frontière client minimale** : layout.tsx est serveur ; les providers clients (Theme, DeviceQuality, SmoothScroll) enveloppent sans forcer le contenu en client. Le contenu critique (titres, offre, CTA) est rendu serveur.
- **Chaîne 3D exemplaire** : `AdaptiveCanvas` = WebGLBoundary (SSR-safe via `useSyncExternalStore`, error boundary, détection WebGL) + ThreeCanvas (budgets par tier) + Suspense/SceneLoader + fallback obligatoire par prop **requise** `fallback`. Tier LITE ne boote jamais WebGL.
- **Loi de séparation animation respectée** : Motion = micro-interactions ; GSAP+ScrollTrigger = cinématique ; Lenis piloté par le ticker GSAP (`lenis.on("scroll", ScrollTrigger.update)`, une seule boucle RAF), détruit au démontage, **désactivé sous reduced-motion** avec repli natif accessible.
- **Conversion** : schémas zod partagés, route `/api/lead` locale simulée, adaptateurs (Resend, webhook CRM) strictement env-gated, échec de livraison jamais propagé à l'utilisateur.

## 3. Écarts vis-à-vis de la cible ACE

| Manque                                                                                                                      | Impact                                                                                                           | Phase          |
| --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------- |
| Pas de couche « moteur » nommée (`src/ace/` ou packages/) — le moteur et le site de démo cohabitent dans les mêmes dossiers | La frontière engine/site n'est pas explicite ; la mise à jour du moteur sur un site client existant est manuelle | Fondations ACE |
| Pas de générateur `ace:new-site`                                                                                            | Créer un site client = cloner + éditer à la main                                                                 | Étape 8        |
| Pas de presets de direction artistique (Design Language) ni de bibliothèque de motions/scènes nommées                       | Chaque site repart des composants bruts                                                                          | Étapes 11–13   |
| Pas d'ACE Score / Review Board                                                                                              | La qualité repose sur `pnpm check` + audits manuels                                                              | Étape 15       |

## 4. Décision Option A vs Option B

Voir `docs/ACE-ARCHITECTURE-DECISION.md` : **Option B retenue** (architecture
modulaire dans l'app unique, `src/` = moteur, séparation renforcée
progressivement), Option A (monorepo pnpm) documentée comme trajectoire
ultérieure. Raisons : loi « un dépôt = un site client », base verte vérifiée,
skills existants supposant l'app unique, risque de migration inutile à ce stade.

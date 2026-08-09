# ACE — Doctrine anti-low-poly (règle moteur non négociable)

Document **interne au moteur** (élagué à la génération). Codifie une règle
absolue d'ACE 0.2 : **ne jamais improviser une 3D procédurale cheap** (cubes,
cônes, « montagnes » triangulaires, primitive « produit ») pour combler un
besoin premium.

## La règle

Quand le besoin visuel est **photoréaliste** ou **premium stylisé**, ACE n'a
JAMAIS le droit de produire une substitution low-poly procédurale comme
**sortie principale**. Il doit, dans cet ordre de préférence :

1. **produire le bon média** — via un provider de génération configuré ou un
   asset réel fourni ;
2. sinon, **déclarer honnêtement** qu'un média externe est requis
   (`MEDIA_ASSET_REQUIRED`) ou qu'aucun provider n'est configuré
   (`PROVIDER_NOT_CONFIGURED`) ;
3. sinon, utiliser un **fallback éditorial premium explicite** (typographie,
   composition, poster de qualité) — assumé, jamais présenté comme la scène 3D
   attendue.

**Jamais** dégrader silencieusement l'ambition artistique.

## Pourquoi une doctrine et pas une bonne intention

Une « bonne pratique » non codifiée se contourne sous pression. Ici la règle est
un **garde exécutable et testé** : elle refuse activement la mauvaise sortie.

## Codification — `src/ace/media-engine/anti-low-poly.ts`

```ts
// Barres qui interdisent une substitution procédurale primitive.
const HIGH_BAR = ["photoreal", "stylized-premium"];

evaluateLowPolyRisk(strategy, qualityBar, assets): { wouldViolate, reason }
assertNoLowPolySubstitution(strategy, qualityBar, assets): void  // throws si violation
```

Verdict de `evaluateLowPolyRisk` :

| strategy  | qualityBar                     | realModel3d | wouldViolate                         |
| --------- | ------------------------------ | ----------- | ------------------------------------ |
| ≠ `webgl` | (toute)                        | (tout)      | `false` (pas de risque de primitive) |
| `webgl`   | `graphic`/`editorial`          | (tout)      | `false` (rendu graphique assumé)     |
| `webgl`   | `photoreal`/`stylized-premium` | `true`      | `false` (vrai glTF = conforme)       |
| `webgl`   | `photoreal`/`stylized-premium` | `false`     | **`true`** ⚠ (violation)             |

`assertNoLowPolySubstitution` lève `Error("[ACE anti-low-poly] …")` sur violation.

## Intégration dans la décision de stratégie

`chooseStrategy` (`strategy.ts`) applique la doctrine :

- WebGL n'est retenu que si un **vrai modèle 3D** existe **et** que le risque
  low-poly est nul.
- Barre haute sans asset ni provider → `editorial-fallback` **avec blocker**
  `PROVIDER_NOT_CONFIGURED` (jamais WebGL procédural).

Et le composant runtime `CinematicScroll` ne monte **jamais** de 3D pour les
stratégies `webgl`/`hybrid`/`2.5d` : il affiche un poster propre (le WebGL réel
passe par `AdaptiveCanvas` avec un vrai modèle, hors de ce wrapper).

## Preuve (tests)

`tests/unit/media-engine.test.ts` vérifie notamment :

- `webgl` + `photoreal` + **sans** `realModel3d` → `assertNoLowPolySubstitution`
  **lève** ; `chooseStrategy` renvoie `editorial-fallback` + blocker.
- `webgl` + `photoreal` + **avec** `realModel3d` → autorisé (pas d'exception).

`tests/unit/cinematic-scroll.test.tsx` vérifie qu'aucun `<canvas>` n'est monté
pour une stratégie `webgl` (repli poster).

## Extension 0.2 — ACE PREMIUM OUTPUT GATE

La doctrine ne couvre plus seulement le low-poly. `premium-gate.ts` interdit de
présenter comme la RÉALISATION de l'intention premium :

`LOW_POLY_SUBSTITUTION` · `MISSING_MEDIA` · `CORRUPTED_MEDIA` ·
`QA_REJECTED_MEDIA` · `TEST_ASSET_AS_FINAL` · `PLACEHOLDER_AS_FINAL` ·
`SUBJECT_LOCK_BROKEN` · `SILENT_FALLBACK`

Trois actions possibles : `SHIP` · `DECLARE_FALLBACK` · `BLOCK`.

Distinction clé : **un site peut fonctionner avec un fallback** — le gate ne
casse rien. Ce qu'il refuse, c'est le MENSONGE : un repli non déclaré présenté
comme l'expérience premium promise devient `DECLARE_FALLBACK`, jamais `SHIP`.

## Formulation courte (pour un reviewer)

> Si le besoin est photoréaliste/premium et qu'il n'y a ni modèle 3D réel, ni
> provider, ni asset : ACE **s'arrête et le dit**. Il ne peint pas des cubes.

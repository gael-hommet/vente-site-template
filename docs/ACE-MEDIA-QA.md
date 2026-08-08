# ACE 0.2 — Media QA & continuité

Document **interne au moteur** (élagué à la génération). Cadre de contrôle
qualité des médias (générés ou fournis) et de la continuité inter-plans.

## Honnêteté d'abord

Évaluer visuellement un rendu (déformations, artefacts, « trop IA », raccords)
**n'est pas résoluble automatiquement** sans modèle de vision. Cette couche ne
prétend donc **jamais** délivrer un « ✓ vendable » à partir de pixels non
inspectés. Elle fournit :

1. un **cadre de scoring structuré**, rempli par une **revue humaine** (ou un
   futur juge de vision) ;
2. des **heuristiques vérifiables** sur les métadonnées du plan (durée, raccords
   déclarés, refs manquantes), qui, elles, sont calculables ici.

Chaque rapport porte `requiresHumanReview: true`. **Toujours.**

## API — `src/ace/media-engine/qa.ts`

```ts
QA_ACCEPT_THRESHOLD = 0.7           // sous ce score global → rejeté (non vendable)

structuralIssues(shot): string[]                       // heuristiques sur le plan
assessMedia(shot, scores?): AceMediaQaReport           // scores défaut = tout à 0
assessContinuity(from, to, perceptualScore?): AceContinuityReport
```

## Scoring pondéré

Cinq axes (0..1), moyenne pondérée :

| Axe              | Poids | Ce qu'il capture                  |
| ---------------- | ----- | --------------------------------- |
| `perceivedValue` | 3     | valeur perçue premium             |
| `continuity`     | 3     | cohérence entre plans             |
| `realism`        | 2     | absence d'artefacts / crédibilité |
| `integrability`  | 2     | intégration propre au site        |
| `narration`      | 1     | rôle narratif tenu                |

`overall = Σ(poids·score) / Σ(poids)`. **Accepté** ssi
`overall ≥ 0.7` **et** aucune issue structurelle. Les `scores` par défaut valent
`0` → rien n'est validé sans revue explicite (choix volontaire).

## Heuristiques structurelles (`structuralIssues`)

Vérifiables sur les métadonnées, sans regarder les pixels :

- durée ≤ 0 → « durée cible non définie » ;
- durée > 12 s → « plan très long : risque de dérive de continuité IA » ;
- `focusPoint` vide → « point d'attention absent (composition floue) » ;
- plan de raccord sans `refIn` → « plan de raccord sans référence amont ».

## Continuité inter-plans (`assessContinuity`)

Détecte les **ruptures structurelles** de raccord :

- `from.refOut === null` → plan de sortie sans référence ;
- `to.refIn === null` → plan d'entrée sans référence ;
- `from.refOut !== to.refIn` → raccord incohérent (les états ne se rejoignent pas).

Score : `continuityScore = max(0, perceptualScore − pénalité)`, où la pénalité
vaut `0.25` par rupture (plafonnée à `0.5`). **Acceptable** ssi
`continuityScore ≥ 0.7` **et** aucune rupture. Le `perceptualScore` (0..1) vient
d'une revue humaine ou d'un futur juge de vision — il n'est pas deviné.

## Où viennent les raccords

`buildShotPlan` chaîne les plans : `refIn` d'un plan = `endState` du plan
précédent. C'est ce qui rend la continuité **vérifiable** ici : un storyboard mal
chaîné produit des ruptures détectables avant toute génération.

## Ce que la QA ne fait pas

- Elle **ne détecte pas** un artefact visuel, une main à six doigts, un « effet
  IA » : cela exige une inspection humaine (ou un modèle de vision, non intégré).
- Elle **ne valide jamais** automatiquement un rendu comme livrable.
- Un futur `ace:media:qa` (CLI) pourra exposer ces fonctions ; il n'est **pas**
  fourni dans cette itération (voir [ACE-MEDIA-ARCHITECTURE.md](ACE-MEDIA-ARCHITECTURE.md)).

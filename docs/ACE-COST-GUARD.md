# ACE 0.2 — Cost guard (garde-fou de coût de génération)

Document **interne au moteur** (élagué à la génération). Estime le coût **avant**
une génération média massive, pour éviter de brûler un budget par surprise.

## Doctrine

- **Aucun tarif inventé.** Les prix viennent EXCLUSIVEMENT d'un
  `AceProviderPricing` fourni par l'utilisateur, avec sa **source déclarée**.
- Sans tarif fourni → coût `0` **avec une note honnête** (« non chiffré »),
  jamais une estimation fictive.
- Un **seuil d'alerte** signale quand la stratégie recommandée dépasse le budget
  et exige une confirmation.

## API — `src/ace/media-engine/cost.ts`

```ts
estimateCost({
  strategy,          // AceMediaStrategy
  shotCount,         // nombre de plans
  pricing,           // AceProviderPricing | null
  alertThreshold?,   // défaut 50 (même devise que pricing)
}): AceCostEstimate
```

`AceProviderPricing` :

```ts
{
  (provider, unitCost, currency, source);
} // source = URL/doc, pour la traçabilité
```

## Trois stratégies de volume

Sorties par plan (`OUTPUTS_PER_SHOT`) :

| Volume        | sorties/plan | intention                     |
| ------------- | ------------ | ----------------------------- |
| `minimal`     | **1**        | une génération par plan       |
| `recommended` | **2**        | + une variante pour le choix  |
| `cautious`    | **3**        | + une itération de correction |

Le rapport chiffre les trois (`minimalCost`, `recommendedCost`, `cautiousCost`).

## Coût nul (local / gratuit)

Coût `0` (sans invention) quand :

- aucun `pricing` fourni, **ou**
- stratégie assemblée localement : `image-sequence`, `2.5d`, `editorial-fallback`
  (ffmpeg/sharp, pas de génération IA payante).

La `note` explique lequel des deux cas s'applique.

## Seuil d'alerte

`exceedsThreshold = recommendedCost > alertThreshold` (défaut `50`). Quand il est
franchi, la `note` porte `⚠ … confirmation requise`, et `buildMediaPlan` ajoute
un risque explicite : « Coût de génération au-dessus du seuil d'alerte : confirmer
avant lot massif. »

## Exemple

```ts
estimateCost({
  strategy: "hybrid",
  shotCount: 3,
  pricing: {
    provider: "higgsfield",
    unitCost: 4,
    currency: "USD",
    source: "grille officielle <url>",
  },
  alertThreshold: 50,
});
// minimalOutputs 3 → 12 USD · recommendedOutputs 6 → 24 USD
// cautiousOutputs 9 → 36 USD · exceedsThreshold false
```

Passer `shotCount: 6` avec le même tarif porte `recommendedCost` à `48` (sous
seuil) ; un `unitCost` plus élevé le ferait basculer au-dessus → alerte.

## Coût RÉELLEMENT consommé (`budget.ts`)

`cost.ts` estime _a priori_ ; `budget.ts` suit ce qui est réellement dépensé
pendant un run et **arrête la boucle** au plafond :

```ts
createBudget({ maxSpend, maxAttemptsPerShot, maxTotalGenerations, currency });
canGenerate(state, nextCost); // refuse AVANT de dépenser
recordSpend(state, record); // amount: number | null
summarizeBudget(state); // { spent, remaining, perShot, isLowerBound }
```

Les montants proviennent du provider lui-même (`hf-api estimate` avant,
`hf-api usage` après) — jamais d'un tarif inventé. Un coût non communiqué est
enregistré `null`, jamais `0` : le total est alors marqué **minorant**
(`isLowerBound: true`) et le nombre de coûts inconnus est affiché.

Garde-fous anti-emballement, tous testés :

- `maxAttemptsPerShot` (défaut 3) borne les retries ;
- `WOULD_EXCEED_MAX_SPEND` refuse une génération qui ferait dépasser le plafond ;
- `MAX_SPEND_REACHED` / `MAX_GENERATIONS_REACHED` arrêtent le run ;
- `ace:media:generate` exige `--yes` pour dépenser (`--dry-run` = estimation seule).

## Règles

- Le moteur ne connaît **aucun** prix par défaut : renseigner le tarif réel du
  provider avant d'exploiter les montants.
- La devise est libre (`currency`) — le moteur ne convertit pas.
- Le cost guard **n'empêche pas** techniquement une génération ; il **informe et
  alerte**. La confirmation reste une décision humaine.

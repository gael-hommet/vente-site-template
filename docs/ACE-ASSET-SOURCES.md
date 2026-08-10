# ACE — D'où viennent les visuels (coût média : 0 €)

Document **interne au moteur** (élagué à la génération). Règle centrale de la
production média d'ACE.

## La doctrine

> **ACE ne génère JAMAIS d'image ni de vidéo via un service payant.**
> Pas d'API de génération, pas de crédits, pas d'abonnement. Un site produit par
> ACE coûte **0 € de média**.

Les visuels viennent toujours du réel. S'il n'y en a pas, ACE **le dit et le
demande** — il ne fabrique pas un substitut.

## La hiérarchie (on ne descend que si le niveau au-dessus est vide)

| Ordre | Source                    | Ce que c'est                                                 |
| ----- | ------------------------- | ------------------------------------------------------------ |
| A     | `CLIENT_PROVIDED`         | médias remis directement par le client                       |
| B     | `OFFICIAL_WEBSITE`        | site officiel de l'entreprise                                |
| C     | `OFFICIAL_SOCIAL`         | comptes officiels, provenance vérifiable                     |
| D     | `OTHER_VERIFIED_OFFICIAL` | autre source clairement rattachée à l'entreprise             |
| E     | `USER_SUPPLIED_GENERATED` | image créée **ailleurs** (ChatGPT, Midjourney…) puis fournie |
| F     | `EDITORIAL_FALLBACK`      | aucun média adéquat : parti-pris typographique assumé        |

Le niveau **E** mérite une précision : une image que vous avez créée avec un
autre outil est, pour ACE, **un asset comme un autre**. Il l'optimise, la cadre,
l'anime, la décline — il n'essaie jamais de la régénérer.

## Chercher d'abord, demander ensuite

L'étape `ASSET_DISCOVERY` impose l'ordre : ACE inspecte le site officiel, les
réseaux officiels et les sources publiques **avant** de poser la moindre
question. Il ne demande « avez-vous des photos ? » que si la recherche n'a rien
donné.

## Ce que chaque média porte

```ts
{
  path, source, sourceRef,        // provenance : obligatoire hors fallback
  nature: "REAL" | "CONCEPTUAL",  // montre-t-il la réalité, ou illustre-t-il ?
  role, kind, width, height, bytes, retrievedAt,
  alt,                            // descriptif, jamais un slogan
  rights: "CONFIRMED" | "OFFICIAL_PUBLIC_UNCONFIRMED" | "UNKNOWN"
}
```

Deux règles de contrôle sont **bloquantes** :

- **un média sans provenance est refusé** ;
- **un média `CONCEPTUAL` ne peut pas illustrer une réalisation ou un produit** —
  ce serait présenter une image d'ambiance comme le travail réel de l'entreprise.

## Démo privée vs production

|                          | `PRIVATE_DEMO`                  | `PRODUCTION`           |
| ------------------------ | ------------------------------- | ---------------------- |
| Médias officiels publics | autorisés, provenance conservée | **droits à confirmer** |
| Indexation               | `noindex` obligatoire           | normale                |
| Publication              | aucune                          | décidée par le client  |
| Revendication de droits  | aucune, mention explicite       | selon accord           |

En démo privée, ACE affiche une mention de provenance :

> Maquette de présentation non sollicitée. Les visuels proviennent des supports
> publics officiels de l'entreprise et restent sa propriété ; aucune
> revendication de droits n'est faite.

`productionBlockers()` liste, en clair, ce qu'il faudrait obtenir pour publier.

## Stratégies possibles — toutes gratuites

photo éditoriale · cinematic still · Ken Burns · parallaxe multiplan · 2.5D avec
depth · galerie · séquence d'images extraite d'une vidéo réelle · `ScrollVideo`
sur une vidéo officielle · plans photo en WebGL · vraie 3D **uniquement** avec un
vrai modèle · expérience typographique · combinaisons.

Aucune ne nécessite un service de génération distant.

## La leçon encodée

Un prototype antérieur, faute de média spatial réel, avait fabriqué un bâtiment
en `boxGeometry` : résultat low-poly invendable. La règle est désormais explicite
et testée : **si une visite immersive exige un média spatial qui n'existe pas,
ACE ne fabrique pas une fausse maison en 3D.** Il choisit le meilleur résultat
honnête disponible (photos réelles, séquence éditoriale, 2.5D, galerie), ou il
déclare qu'un asset spatial réel serait nécessaire. Il ne présente jamais un
diaporama comme une visite.

## Voir aussi

- [ACE-ANTI-LOW-POLY.md](ACE-ANTI-LOW-POLY.md) — la doctrine et sa garde.
- [ACE-AUTOPILOT.md](ACE-AUTOPILOT.md) — où s'insère `ASSET_DISCOVERY`.
- [ACE-MEDIA-ARCHITECTURE.md](ACE-MEDIA-ARCHITECTURE.md) — la couche média.

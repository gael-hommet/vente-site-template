# Guide de prise de vue — Spatial Cinema

À quoi sert ce document : savoir **ce qu'il faut photographier** pour obtenir une
expérience spatiale, et **ce que chaque type de matière permet réellement**.

Aucune photo n'est générée par une IA. Aucun service payant. On travaille avec
ce qui existe.

---

## Ce que vous fournissez → ce que ça donne

| Vous avez                                                   | Vous obtenez                                                         | Condition                                            |
| ----------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------- |
| **1 photo**                                                 | une scène en profondeur : la caméra s'y déplace, le relief se creuse | il faut **sa carte de profondeur**                   |
| **4 photos d'endroits différents** (sans recouvrement)      | un **voyage** : 4 espaces enchaînés sans coupure                     | une carte de profondeur **par photo**                |
| **20 à 100 vues qui se recouvrent** (ou une vidéo continue) | candidat à une reconstruction 3D                                     | **non réalisé par ACE 0.3** — signalé, jamais simulé |
| **un fichier `.glb` / `.gltf`**                             | de la vraie 3D navigable                                             | —                                                    |
| **une vraie vidéo continue**                                | un défilement vidéo au scroll (ScrollVideo)                          | —                                                    |

## La carte de profondeur est obligatoire

Une carte de profondeur est une image en niveaux de gris, **même cadrage et même
proportions que la photo** : **blanc = proche**, **noir = lointain**.

**ACE ne l'invente pas.** Sans elle, la scène est refusée
(`DEPTH_MAP_REQUIRED`) et la page reste éditoriale — c'est volontaire : mieux
vaut une belle page honnête qu'un faux relief.

Nommage reconnu automatiquement, à côté de l'image :

```
salle.jpg
salle.depth.png      (ou salle-depth.png)
```

## Comment photographier

**Ce qui marche bien**

- De la **profondeur dans le cadre** : un premier plan net, un fond distant.
  Un couloir, une enfilade de tables, une entrée, une percée vers l'extérieur.
- Un **appareil tenu droit** : horizon horizontal, verticales verticales. Le
  moteur fait avancer une caméra ; un cadre penché se voit immédiatement.
- Une **lumière homogène** entre les photos d'un même voyage : la température de
  couleur doit se ressembler d'une scène à l'autre, sinon le raccord se voit.
- De la **définition** : 2000 px de large suffisent largement.

**Ce qui casse l'illusion**

- Une photo **à plat** (mur de face, aplat, gros plan sans arrière-plan) : il n'y
  a rien à creuser.
- Un **très grand angle** déformant.
- Une personne **au premier plan très près** : elle se déchire quand la caméra
  avance.
- Une vitre ou un miroir occupant tout le cadre : la profondeur y est fausse.

## Composer un voyage à plusieurs photos

L'ordre raconte une progression : **on avance**. Par exemple
extérieur → seuil → intérieur → dégagement.

Pour que les raccords soient invisibles, prévoyez dans chaque photo un endroit
par lequel « passer » : une porte, une baie, une arche, une zone sombre. C'est
là que la caméra traversera. Deux photos qui se raccordent bien partagent une
**direction** (on entrait vers la droite, on ressort vers la droite) et un
**niveau d'horizon** proche.

Évitez : une caméra qui avance puis, à la scène suivante, une vue qui regarde en
arrière. Le contrôle qualité le signale (`DISCONTINUOUS_DIRECTION`).

## Droits

Chaque média est journalisé avec son origine, sa nature (`REAL` / `CONCEPTUAL`)
et ses droits. Une image d'origine inconnue n'entre pas dans une visite. En
production, seuls les droits **confirmés** sont publiés ; une maquette privée
peut utiliser un média officiel public, **à confirmer avant publication**.

Voir `ACE-ASSET-SOURCES.md`.

## Ce qu'une scène en profondeur ne fera jamais

- regarder **derrière** un meuble ;
- **pivoter à 90°** dans une seule photo ;
- **inventer** une pièce hors champ.

C'est une illusion spatiale très convaincante, pas une reconstruction. Les
mouvements de caméra sont donc contenus : au-delà, le maillage se troue.

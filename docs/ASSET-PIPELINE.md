# Pipeline d'assets

Ce document décrit comment les fichiers déposés dans **`input/assets/`** sont transformés en dérivés optimisés dans **`public/`**, via la skill **`/ingest-assets`** et les scripts **`assets:*`**.

---

## Principe

```
input/assets/  ──(/ingest-assets → assets:*)──▶  public/  (dérivés optimisés)
                          │
                          └──▶  rapport d'ingestion
```

Règles fondamentales :

- **Ne jamais écraser les originaux.** `input/assets/` est la source de vérité et reste intact.
- **Les sorties vont dans des dossiers dédiés** de `public/` (par type).
- **Un rapport est produit** à chaque exécution (formats générés, tailles avant/après, gains, avertissements).
- Les **originaux lourds ne sont pas commités/servis** ; seuls les dérivés optimisés partent dans `public/`.

---

## Scripts disponibles

| Script | Rôle |
| --- | --- |
| `assets:audit` | Inventorie les assets et signale les problèmes (poids excessif, formats non optimisés, dimensions). |
| `assets:images` | Images → **AVIF/WebP** (via **sharp**). |
| `assets:video` | Vidéos → **mp4/webm** + **poster** + **séquence d'images** (via **ffmpeg**). |
| `assets:models` | Modèles 3D → nettoyage GLB, compression, textures (via **@gltf-transform**). |
| `assets:all` | Enchaîne l'ensemble des pipelines ci-dessus. |

La skill `/ingest-assets` orchestre ces scripts sur le contenu de `input/assets/`.

---

## Images — sharp

- Entrées : JPG/PNG/… déposés dans `input/assets/`.
- Sorties : **AVIF** et **WebP** (formats modernes, meilleur ratio qualité/poids), aux tailles responsives nécessaires.
- Génère les variantes pour servir des images légères adaptées à chaque breakpoint.
- Respecte les plafonds de `docs/PERFORMANCE-BUDGET.md`.

## Vidéos — ffmpeg

- Entrées : fichiers vidéo dans `input/assets/`.
- Sorties :
  - **mp4** (H.264/compatible large) et **webm** (VP9/AV1, plus léger) ;
  - un **poster** (image de première frame / frame clé) pour l'affichage immédiat et le fallback ;
  - une **séquence d'images** légère, utilisable notamment par le tier **LITE**.
- **ffmpeg provient du devcontainer** — il est installé dans l'environnement Codespace, pas via pnpm. (Voir `docs/TROUBLESHOOTING.md` si ffmpeg est absent en local.)

## Modèles 3D — @gltf-transform

- Entrées : GLB/GLTF dans `input/assets/`.
- Traitements :
  - **nettoyage** du GLB (dédoublonnage, suppression des nœuds inutiles) ;
  - **compression géométrie** : **Draco** ou **Meshopt** ;
  - **redimensionnement des textures** selon le tier (2K ULTRA / 1K BALANCED) ;
  - **compression texture** **KTX2** (GPU-friendly).
- Objectif : rester sous les plafonds modèle de `docs/PERFORMANCE-BUDGET.md` (GLB ≤ 2 Mo cible).

---

## Rapport d'ingestion

Chaque passage produit un rapport listant, par fichier : format(s) de sortie, dimensions, taille avant/après, gain, et avertissements (asset trop lourd, format non pris en charge, texture surdimensionnée). Ce rapport sert de base à l'audit d'assets et aux corrections.

---

## Bonnes pratiques

1. Déposer des **originaux de bonne qualité** dans `input/assets/` — la qualité de sortie en dépend.
2. Relancer `assets:audit` après ingestion pour valider les gains.
3. Ne jamais éditer manuellement les fichiers de `public/` générés : modifier l'original puis réingérer.
4. Vérifier qu'aucun original lourd n'est commité par erreur.

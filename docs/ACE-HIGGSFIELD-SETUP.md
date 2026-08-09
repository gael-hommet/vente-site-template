# ACE 0.2 — Setup du provider Higgsfield (CLI officiel `hf-api`)

Document **interne au moteur** (élagué à la génération). Active la génération
d'images/vidéos dans ACE.

> **Correctif d'honnêteté.** Une version antérieure de cette doc décrivait une
> API REST `https://api.higgsfield.ai/v1/generations` avec un header
> `Authorization: Bearer <clé>`. **Ce contrat n'a jamais été vérifié et il est
> faux** : l'audit a mesuré `HTTP 521` sur cet hôte (Cloudflare — origine
> injoignable). Cet endpoint a été supprimé du code.
>
> La voie officielle **réellement disponible** est le CLI `hf-api`, dont le
> contrat ci-dessous a été capturé **en exécutant le binaire**.

## Pourquoi le CLI et pas une API maison

Le paquet officiel [`@higgsfield/cloud-cli`](https://www.npmjs.com/package/@higgsfield/cloud-cli)
(dépôt `github.com/higgsfield-ai/cloud-cli`) se décrit lui-même ainsi :

> _« hf-api drives the Higgsfield platform generation API using an API key.
> It is designed to be operated by an autonomous agent. »_

C'est exactement le cas d'usage d'ACE. Le CLI expose de surcroît tout ce dont le
moteur a besoin : découverte des modèles, estimation de coût, génération,
polling, et consommation réelle.

## Installation

```bash
npm i -g @higgsfield/cloud-cli     # installe le binaire `hf-api`
hf-api --version
```

> Le postinstall télécharge le binaire (Go, statique) correspondant à la
> plateforme depuis les releases GitHub du dépôt officiel.
>
> **ACE ne déclare PAS ce paquet en dépendance** : le provider doit rester
> optionnel et l'installation ne doit pas dépendre du réseau. Sans lui, ACE
> fonctionne pleinement — il ne génère simplement pas de médias IA.

Binaire hors `PATH` ? Pointer ACE dessus :

```bash
export HF_API_BIN=/chemin/vers/hf-api
```

## Authentification (deux voies équivalentes)

La clé a le format **`<api_key_id>:<secret>`** (et non un simple token).

```bash
hf-api auth login                       # invite interactive (clé stockée par le CLI)
# ou
export HIGGSFIELD_API_KEY="<id>:<secret>"
```

Vérifier — aucune valeur de credential n'est jamais affichée :

```bash
hf-api auth status
pnpm ace:provider:check
```

| État                    | `ace:provider:check`      | Code |
| ----------------------- | ------------------------- | ---- |
| CLI absent              | `PROVIDER_NOT_CONFIGURED` | 3    |
| CLI présent, pas de clé | `PROVIDER_AUTH_PENDING`   | 3    |
| CLI + clé valides       | `READY`                   | 0    |

> ACE lit `process.env` **uniquement** ; il ne lit **jamais** un fichier `.env`
> (gitignoré) et ne passe **jamais** la clé en argument de ligne de commande
> (elle fuiterait dans la table des processus). Aucune clé n'est loguée.

## Contrat du CLI (vérifié en l'exécutant)

```
hf-api auth login|status|logout
hf-api models [slug] [--search s] [--output-type image|video|audio|3d_model]
                     [--operation-type text2image|image2video]
hf-api estimate <slug> [--param k=v]... [--input params.json]
hf-api generate <slug> [--param k=v]... [--input params.json]
                       [--wait] [--wait-interval d] [--wait-timeout d]
hf-api status <request_id>
hf-api wait   <request_id> [--interval d] [--timeout d]
hf-api usage  [--timeframe hour|day|week|month] [--model s] [--start] [--end]
--json  # global : réponses JSON brutes sur stdout
```

**Codes de sortie mesurés** : `0` succès · `1` erreur d'usage · `2` non
authentifié. Les erreurs sortent en **texte sur stderr** (pas en JSON, même avec
`--json`) — ACE en tient compte.

Ce que chaque commande apporte au moteur :

| Commande          | Rôle dans ACE                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| `models`          | **Catalogue réel** (« listed == usable ») → le model router ne propose que des modèles existants |
| `estimate`        | Coût **avant** dépense → cost guard, `--dry-run`                                                 |
| `generate --wait` | Génération + attente de l'état terminal                                                          |
| `status` / `wait` | Suivi d'une requête                                                                              |
| `usage`           | Coût **réellement consommé** par modèle                                                          |

## Utilisation depuis ACE

```bash
pnpm ace:provider:check                                   # statut
pnpm ace:media:generate --brief brief.json --dry-run      # estimation seule
pnpm ace:media:generate --brief brief.json --out out --yes \
     --max-spend 20 --max-attempts 3                      # génération réelle
pnpm ace:media:qa --manifest out/media-manifest.json      # contrôle
```

`--yes` est **obligatoire** pour dépenser : sans lui, la commande s'arrête après
l'estimation. `--max-spend` arrête net la boucle au plafond.

## Ce qui reste À CONFIRMER

Le **contrat de commande** est vérifié ; le **schéma JSON des réponses** ne l'est
pas (aucune authentification disponible lors de l'implémentation). ACE ne devine
donc aucun chemin de champ :

- `extractModels()` accepte plusieurs formes et renvoie `HF_SCHEMA_UNVERIFIED`
  s'il ne trouve rien d'exploitable — plutôt qu'une liste vide trompeuse ;
- `extractOutputUrls()` parcourt récursivement la réponse à la recherche d'URLs ;
- l'estimation cherche une valeur numérique sans supposer son emplacement.

À la première authentification réelle, vérifier :

```bash
hf-api models --json | head -40
hf-api estimate <slug> --param prompt="test" --json
```

puis, si nécessaire, affiner les extracteurs dans
`src/ace/media-engine/node/hf-cli.ts`.

## Coûts

Le cost guard n'utilise que des montants **fournis par le provider**
(`estimate` / `usage`). ACE n'invente aucun tarif ; un coût inconnu est `null` et
le total est déclaré **minorant**. Voir [ACE-COST-GUARD.md](ACE-COST-GUARD.md).

## Dépannage

| Symptôme                  | Cause                                    | Action                                           |
| ------------------------- | ---------------------------------------- | ------------------------------------------------ |
| `PROVIDER_NOT_CONFIGURED` | binaire `hf-api` introuvable             | `npm i -g @higgsfield/cloud-cli` ou `HF_API_BIN` |
| `PROVIDER_AUTH_PENDING`   | pas de clé active                        | `hf-api auth login`                              |
| `HF_SCHEMA_UNVERIFIED`    | réponse non reconnue                     | inspecter `--json`, ajuster les extracteurs      |
| `NO_MATCHING_MODEL`       | catalogue sans modèle couvrant le besoin | changer de stratégie ou fournir un asset         |

## Voir aussi

- [ACE-PROVIDER-INTEGRATION.md](ACE-PROVIDER-INTEGRATION.md) — brancher un autre provider.
- [ACE-MEDIA-ARCHITECTURE.md](ACE-MEDIA-ARCHITECTURE.md) — la couche complète.

# ACE 0.2 — Setup du provider Higgsfield

Document **interne au moteur** (élagué à la génération). Guide d'activation de
l'adapter Higgsfield pour la génération d'images/vidéos.

> **Statut d'honnêteté (à lire d'abord).** L'adapter est **codé, guardé et
> testé**, mais le **contrat exact de l'API Higgsfield n'a pas été validé** dans
> cet environnement (aucune credential, aucun accès réseau vérifié). Tant que le
> schéma payload/réponse n'est pas confirmé contre l'API réelle, `generate()`
> **refuse honnêtement** (`GENERATION_FAILED` avec message explicite) plutôt que
> de renvoyer un faux succès. Aucune génération n'est simulée.

## Ce que l'adapter fait aujourd'hui

- Déclare ses capacités : `generate-image`, `generate-video`.
- Rapporte un statut RÉEL : `PROVIDER_NOT_CONFIGURED` sans `HIGGSFIELD_API_KEY`,
  `READY` une fois la clé présente.
- Encapsule l'appel réseau (endpoint/headers/payload paramétrables par env).
- **N'invente jamais un succès.** Le mapping de la réponse est marqué
  `À CONFIRMER` dans `src/ace/media-engine/providers/higgsfield.ts`.

## Variables d'environnement

| Variable              | Rôle                                                      | Requis  |
| --------------------- | --------------------------------------------------------- | ------- |
| `HIGGSFIELD_API_KEY`  | Clé d'authentification (`Authorization: Bearer …`)        | **oui** |
| `HIGGSFIELD_BASE_URL` | Base URL de l'API (défaut `https://api.higgsfield.ai/v1`) | non     |
| `HIGGSFIELD_MODEL`    | Modèle à cibler                                           | non     |

> ACE lit ces variables via `process.env` **uniquement**. Il ne lit **jamais**
> un fichier `.env` (gitignoré). C'est le runtime/CI qui charge l'environnement.
> Ne jamais committer la clé ; ne jamais la loguer.

## Activer (local)

1. Obtenir une clé API Higgsfield (compte du client / du projet).
2. Exporter la clé dans l'environnement du shell (jamais dans un fichier suivi) :
   ```bash
   export HIGGSFIELD_API_KEY="votre_cle"
   # optionnel :
   export HIGGSFIELD_BASE_URL="https://api.higgsfield.ai/v1"
   export HIGGSFIELD_MODEL="<modele>"
   ```
3. Vérifier le statut (aucune valeur de clé n'est affichée) :
   ```bash
   pnpm ace:provider:check
   ```
   Attendu sans clé : `✗ higgsfield — PROVIDER_NOT_CONFIGURED` (exit 3).
   Avec clé : `✓ higgsfield — READY` (exit 0).

## Confirmer le contrat d'API (étape requise avant usage réel)

Avant toute génération réelle, il faut **valider le schéma** contre la doc
officielle Higgsfield et adapter l'adapter en conséquence :

1. Endpoint exact (l'adapter appelle `POST {baseUrl}/generations` — **à vérifier**).
2. Format du **payload** (l'adapter envoie `model`, `prompt`, `reference_image`,
   `shot`, `camera`, `duration_s` — **à mapper** sur les champs réels).
3. Format de la **réponse** (synchrone ? asynchrone avec polling ? où sont les
   URLs de sortie ?). Adapter le retour `outputs` au format réel.
4. Codes d'erreur et limites de débit.

Tant que ces points ne sont pas confirmés, l'adapter renvoie `GENERATION_FAILED`
avec un aperçu des clés reçues — c'est **volontaire** (honnêteté).

## Coûts

Le cost guard (`estimateCost`) n'utilise que des tarifs **fournis** via
`AceProviderPricing` (avec `source` déclarée). Renseigner le tarif Higgsfield
réel depuis la grille officielle — ACE n'invente aucun prix. Voir
[ACE-COST-GUARD.md](ACE-COST-GUARD.md).

## Dépannage

| Symptôme                                  | Cause probable                    | Action                                        |
| ----------------------------------------- | --------------------------------- | --------------------------------------------- |
| `PROVIDER_NOT_CONFIGURED`                 | `HIGGSFIELD_API_KEY` absente/vide | exporter la clé dans l'ENV                    |
| `GENERATION_FAILED` (mapping À CONFIRMER) | schéma de réponse non validé      | confirmer le contrat d'API, adapter `outputs` |
| `GENERATION_FAILED` (réseau/env)          | pas d'accès réseau / URL erronée  | vérifier connectivité + `HIGGSFIELD_BASE_URL` |
| `4xx/5xx`                                 | clé invalide / quota / payload    | vérifier la clé et le format contre la doc    |

## Voir aussi

- [ACE-PROVIDER-INTEGRATION.md](ACE-PROVIDER-INTEGRATION.md) — le contrat générique.
- [ACE-MEDIA-ARCHITECTURE.md](ACE-MEDIA-ARCHITECTURE.md) — la couche complète.

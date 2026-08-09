# ACE 0.2 — Intégration d'un provider média

Document **interne au moteur** (élagué à la génération). Décrit l'abstraction de
provider et comment en brancher un nouveau — proprement, modulaire, documenté,
**optionnel si non configuré, jamais simulé**.

## Le contrat — `src/ace/media-engine/providers/types.ts`

```ts
interface MediaProvider {
  readonly name: string;
  readonly capabilities: readonly ProviderCapability[];
  status(): ProviderStatus; // READY | PROVIDER_NOT_CONFIGURED | UNAVAILABLE
  generate?(req: GenerateRequest): Promise<ProviderResult>; // NON simulé
}
```

- `ProviderCapability` : `generate-image`, `generate-video`, `extract-frames`,
  `assemble-video`, `optimize`, `upscale`, `interpolate`.
- `ProviderStatus` : `READY` · `PROVIDER_NOT_CONFIGURED` (aucun mécanisme
  d'accès) · `PROVIDER_AUTH_PENDING` (outil présent, authentification absente) ·
  `PROVIDER_CONTRACT_UNVERIFIED` (accès possible, contrat non vérifié) ·
  `UNAVAILABLE` (dépendance manquante).
- `ProviderResult` = union `{ ok: true, outputs, meta? }` |
  `{ ok: false, code, message }` avec `code ∈ { PROVIDER_NOT_CONFIGURED,
MEDIA_ASSET_REQUIRED, UNAVAILABLE, GENERATION_FAILED }`.

## Le registre — `providers/registry.ts` (fail-safe)

```ts
const PROVIDERS = [localProvider, higgsfieldProvider];

allProviders(); // tous les adapters connus
getProvider(name); // un adapter par nom
readyProviders(); // ceux dont status() === "READY"
providersFor(capability); // ceux qui sont prêts ET fournissent la capacité
```

Un provider absent/non configuré est **filtré par son `status()`** — il ne casse
jamais le moteur.

## La config — `config.ts` (ENV uniquement)

Les providers sont activés par variables d'environnement, **jamais** par lecture
d'un fichier `.env` (gitignoré, sensible) :

```ts
KNOWN_PROVIDERS = [{ name: "higgsfield", requiredEnv: "HIGGSFIELD_API_KEY",
                     optionalEnv: ["HIGGSFIELD_BASE_URL", "HIGGSFIELD_MODEL"],
                     setupDoc: "docs/ACE-HIGGSFIELD-SETUP.md" }]

isProviderConfigured(name)   configuredProviders()   unconfiguredProviders()
```

Une valeur de credential n'est **jamais** loguée (seulement sa présence).

## Les deux adapters fournis

### `local` — traitement réel (pas d'IA)

Capacités : `extract-frames`, `assemble-video`, `optimize`. `status()` = `READY`
si ffmpeg est présent, sinon `UNAVAILABLE`. La détection réelle des binaires est
faite côté Node (CLI) et injectée via `setLocalToolAvailability(...)` — le bundle
client ne teste jamais un binaire. Pas de `generate` (aucune génération IA).

### `higgsfield` — génération IA via le CLI OFFICIEL `hf-api`

Capacités : `generate-image`, `generate-video`.

> Une version antérieure appelait un endpoint REST **supposé**
> (`api.higgsfield.ai/v1`). L'audit a mesuré `HTTP 521` : cet endpoint ne sert
> pas d'API. Il a été **supprimé**. ACE s'appuie désormais sur le CLI officiel
> `@higgsfield/cloud-cli`, conçu pour être piloté par un agent autonome, dont le
> contrat a été capturé **en exécutant le binaire**.

L'adapter reste **isomorphe** (aucun `node:*`) : il décrit le provider et délègue
l'exécution à un pilote injecté côté Node (`setHiggsfieldRuntime`), implémenté
dans `node/hf-cli.ts` + `node/provider-runtime.ts`. Statut :

| Constat réel                                   | `status()`                |
| ---------------------------------------------- | ------------------------- |
| binaire `hf-api` absent                        | `PROVIDER_NOT_CONFIGURED` |
| binaire présent, `hf-api auth status` en échec | `PROVIDER_AUTH_PENDING`   |
| binaire + authentification                     | `READY`                   |

Voir [ACE-HIGGSFIELD-SETUP.md](ACE-HIGGSFIELD-SETUP.md).

## Ajouter un nouveau provider

1. **Créer l'adapter** `providers/<nom>.ts` implémentant `MediaProvider`.
   - `status()` reflète l'état RÉEL (credential présent ? dépendance là ?).
   - `generate()` (si applicable) fait un vrai appel ; **ne simule jamais** un
     succès. En cas de doute sur le schéma, renvoyer `GENERATION_FAILED` avec un
     message clair, comme l'adapter Higgsfield.
2. **Déclarer l'env** dans `KNOWN_PROVIDERS` (`config.ts`) : `requiredEnv`,
   `optionalEnv`, `setupDoc`.
3. **Enregistrer** l'adapter dans `PROVIDERS` (`registry.ts`).
4. **Documenter** un `docs/ACE-<NOM>-SETUP.md` (install, auth, test, coûts).
5. **Tester** : `status()` sans credential = `PROVIDER_NOT_CONFIGURED` ;
   `generate()` refuse sans credential. (Cf. `tests/unit/media-engine.test.ts`.)
6. **Tarifs** : si le provider est payant, fournir un `AceProviderPricing`
   (source déclarée) pour le cost guard — voir [ACE-COST-GUARD.md](ACE-COST-GUARD.md).

## Règles d'or

- **Jamais** prétendre qu'un provider fonctionne s'il n'est pas
  configuré/authentifié/validé. Statut honnête, message clair.
- **Jamais** committer un credential ; **jamais** le loguer.
- Un provider est **optionnel** : son absence n'empêche pas ACE de décider,
  planifier, chiffrer, contrôler et assembler des médias fournis.
- Le schéma d'API non vérifié est marqué **À CONFIRMER** dans le code et la doc,
  pas contourné par un mock déguisé en succès.

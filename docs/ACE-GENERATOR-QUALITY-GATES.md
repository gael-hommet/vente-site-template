# ACE — Quality gates du générateur

Document **interne au moteur**. Décrit ce que `pnpm ace:new-site` vérifie
avant de déclarer un site généré prêt, et comment relancer chaque étape
manuellement en cas d'échec.

## 1. Gates exécutés (ordre, sauf `--skip-install`/`--skip-check`)

| #   | Étape                        | Commande (dans le site généré)   | Bloquant |
| --- | ---------------------------- | -------------------------------- | -------- |
| 1   | Installation (lockfile figé) | `pnpm install --frozen-lockfile` | oui      |
| 2   | Format                       | `pnpm run format:check`          | oui      |
| 3   | Lint                         | `pnpm run lint`                  | oui      |
| 4   | Typecheck                    | `pnpm run typecheck`             | oui      |
| 5   | Tests unitaires              | `pnpm run test`                  | oui      |
| 6   | Build production             | `pnpm run build`                 | oui      |

Chaque étape s'arrête à la première rouge : aucune étape suivante ne s'exécute
et le CLI sort en code `1`. **Aucune étape n'est jamais annoncée comme
réussie si elle a échoué** — le message d'erreur inclut stdout/stderr de la
commande en échec.

## 2. Gates structurels (exécutés avant même l'installation)

Ces contrôles ne dépendent d'aucune installation de dépendances — ils opèrent
directement sur les fichiers extraits :

- **Validation de configuration** : schéma Zod (`clientConfigSchema`),
  conflits de features (`findFeatureConflicts`), ids de recipes
  (`validateRecipeSelection`). Voir `src/ace/config/client-loader.ts`.
- **Contrôle des routes internes** : recherche de `src/app/lab/`,
  `src/app/ace-lab/`, `src/app/engine/` dans l'arbre extrait — doit être vide.
- **Contrôle anti-fuite** : secrets (motifs de clé API/AWS/clé privée),
  fichiers interdits (`.env`, `.pem`, `node_modules`, `.git`), identité d'un
  autre client connu, fichiers > 500 Ko hors `public/assets/client/`.
- **Contrôle des placeholders** : le rapport de génération liste toute valeur
  `[À CONFIRMER]` héritée du gabarit — ce n'est pas bloquant (un site généré
  démarre volontairement incomplet), mais doit être visible avant publication.

## 3. Relancer un gate manuellement

Depuis le site généré :

```bash
cd <dossier-du-site>
pnpm install
pnpm run format:check   # ou: pnpm run format (corrige)
pnpm run lint           # ou: pnpm run lint:fix
pnpm run typecheck
pnpm run test
pnpm run build
# équivalent groupé :
pnpm check
```

## 4. Témoin réel (validation de la Phase 5 du moteur)

Le générateur lui-même est validé par une génération réelle et jetable :

```bash
pnpm ace:new-site --name "Témoin ACE" --out /tmp/ace-witness
cd /tmp/ace-witness && pnpm check
rm -rf /tmp/ace-witness   # jetable — jamais commité, jamais poussé
```

Ce témoin doit produire un `pnpm check` intégralement vert. C'est la preuve
que le moteur, à l'instant du commit, produit un site livrable — pas
seulement que ses propres tests passent.

## 5. Tests automatisés du CLI

`tests/unit/ace-generator-cli.test.ts` couvre, en lançant le script réel dans
des dossiers temporaires isolés (`--skip-install --skip-check` pour rester
rapide) :

- aide CLI (`--help`) ;
- arguments manquants/invalides (`--name`, `--out`, chemins introuvables) ;
- configuration invalide, recipe inconnue, conflit de features — refusés
  **avant** toute écriture sur disque de sortie ;
- sortie existante non vide sans `--force` ;
- génération réussie (minimale et complète) ;
- identité injectée (`package.json`, `ace.meta.json`, `.env.local`) ;
- absence de routes internes et de documents moteur ;
- copie d'assets + manifeste (hash, chemins, non-modification des sources) ;
- rapport de génération produit et cohérent ;
- mode proposition privée (`robots.ts`/`sitemap.ts`) ;
- features résolues cohérentes avec la config source.

Ces tests font partie de `pnpm test` du moteur — ils tournent à chaque
`pnpm check`. Ils ne remplacent pas le témoin réel du § 4 (qui seul exécute
réellement `pnpm check` du site généré) : ils vérifient la structure produite,
pas la buildabilité complète, pour rester rapides en CI.

## 6. En cas d'échec

1. Lire le message d'erreur (stdout/stderr de l'étape en échec est affiché).
2. Corriger la cause dans **le moteur** (jamais dans le site généré — il sera
   régénéré). Les causes typiques :
   - `client.config.ts` référence une recipe/preset inexistant → corriger la
     config ou ajouter la recipe/preset manquant au moteur ;
   - lint/typecheck rouge → régression introduite dans le moteur lui-même,
     puisque le site généré est un sous-ensemble direct du moteur ;
   - build rouge → généralement un import cassé par l'élagage des routes
     internes (vérifier qu'aucun fichier public n'importe un module
     `src/components/lab/*` ou `src/components/ace-lab/*`).
3. Relancer `pnpm check` du moteur, puis régénérer le témoin (§ 4).

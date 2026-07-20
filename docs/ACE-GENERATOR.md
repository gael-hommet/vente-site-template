# ACE — Générateur de sites clients (`pnpm ace:new-site`)

Document **interne au moteur** (élagué à la génération). Guide pratique du
générateur config-aware. Pour le contrat d'entrée/sortie détaillé, voir
`docs/ACE-GENERATION-CONTRACT.md` ; pour les quality gates,
`docs/ACE-GENERATOR-QUALITY-GATES.md`.

## Commande

```bash
pnpm ace:new-site \
  --name "Nom du client" \
  --slug nom-client \
  --brief input/CLIENT_BRIEF.md \
  --config input/client.config.ts \
  --assets input/assets \
  --out /workspaces/nom-client \
  [--url https://nom-client.example] \
  [--force] [--skip-install] [--skip-check]
```

`--name` et `--out` sont les seuls arguments obligatoires — tous les autres
ont un défaut sain (voir `pnpm ace:new-site --help`).

## Exemple minimal

```bash
pnpm ace:new-site --name "Atelier Nord" --out ../atelier-nord
```

Utilise `input/client.config.ts` et `input/CLIENT_BRIEF.md` du moteur par
défaut (les gabarits neutres livrés avec ACE), sans assets. Suffisant pour un
premier témoin jetable.

## Exemple complet

```bash
pnpm ace:new-site \
  --name "Atelier Nord — Architecture" \
  --slug atelier-nord \
  --brief input/CLIENT_BRIEF.md \
  --config input/client.config.ts \
  --assets input/assets \
  --out /workspaces/atelier-nord \
  --url https://atelier-nord.example
```

## Exemple de `client.config.ts`

```ts
import type { ClientConfigInput } from "@/ace/config";

const config: ClientConfigInput = {
  identity: { name: "Atelier Nord", tagline: "Architecture bioclimatique", locale: "fr-FR" },
  industry: "architecture",
  goals: { primaryConversion: "quote" },
  design: {
    preset: "onyx",
    motionIntensity: "cinematic",
    webglIntensity: "accent",
    density: "spacious",
  },
  features: { collections: true, stickyMobileCta: true },
  recipes: {
    hero: "media-first",
    navigation: "editorial-folio",
    projects: "case-study-sequence",
    storytelling: "alternating-narrative",
    conversion: "premium-inquiry",
    layout: "editorial-layout",
  },
  collections: [{ id: "projets", label: "Projets", itemLabel: "projet", kind: "projects" }],
};

export default config;
```

Référence complète des champs : `src/ace/config/client-schema.ts`. Ids de
recipes disponibles : `src/ace/recipes/catalog.ts`.

## Erreurs courantes

| Erreur                                              | Cause                                            | Correction                                                                   |
| --------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
| `Configuration client invalide`                     | champ requis manquant/type incorrect             | corriger `client.config.ts` selon le message (chemin + raison)               |
| `Recipe(s) inconnue(s)`                             | id de recipe absent des registres                | choisir un id existant (`src/ace/recipes/catalog.ts`) ou l'ajouter au moteur |
| `Combinaisons de features incompatibles`            | ex. `webgl=false` + `webglIntensity≠"none"`      | aligner `features.*` et `design.*Intensity`                                  |
| `le dossier cible existe et n'est pas vide`         | `--out` déjà occupé                              | choisir un autre dossier ou `--force` (écrase)                               |
| `fichier de configuration/brief/assets introuvable` | chemin invalide passé en argument                | vérifier le chemin (relatif au cwd d'exécution)                              |
| `Contrôle de fuite ÉCHOUÉ`                          | secret/route interne/identité étrangère détectés | ne jamais contourner — corriger la source (voir le message détaillé)         |
| une étape de quality gate en rouge                  | régression dans le moteur lui-même               | corriger dans le moteur, jamais dans le site généré ; relancer               |

## Procédure de reprise après échec

1. Le dossier `--out` n'est créé qu'après le contrôle anti-fuite — un échec de
   validation/anti-fuite ne laisse **aucun** dossier partiel.
2. Un échec de quality gate (§ install/format/lint/typecheck/test/build)
   laisse le site généré sur disque, **non validé** — ne pas le livrer tel
   quel. Corriger la cause dans le moteur (voir
   `docs/ACE-GENERATOR-QUALITY-GATES.md#6-en-cas-déchec`), puis régénérer avec
   `--force`.
3. Ne jamais éditer directement les fichiers d'un site déjà généré pour
   contourner un gate — toute correction pérenne doit vivre dans le moteur
   (sinon elle est perdue à la prochaine régénération).

## Prochain client — checklist courte

1. Remplir un `client.config.ts` et un `CLIENT_BRIEF.md` à partir de faits
   vérifiés (jamais inventés — voir `.claude/rules/security.md`).
2. Déposer les assets sources dans un dossier dédié, journalisés dans
   `input/ASSET_SOURCES.md` (origine, licence, auteur, date).
3. `pnpm ace:new-site --name … --config … --brief … --assets … --out …`
4. Lire `docs/ACE-GENERATION-REPORT.md` du site généré : recipes retenues,
   features résolues, placeholders `[À CONFIRMER]` restants.
5. Remplacer les faits placeholder par les faits vérifiés du brief.
6. `pnpm check` (déjà vert à la génération, sauf `--skip-check`).
7. Ne jamais pousser/déployer sans ordre explicite (voir
   `.claude/rules/security.md`).

## Apprentissages historiques (site témoin `onyx`, 2026-07-17)

Conservés pour mémoire — corrections déjà intégrées au moteur, ne pas les
re-découvrir :

| Écart détecté                                                                      | Correction déjà intégrée                                                                                                                     |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Les docs internes (mentionnant des clients réels) partaient dans les sites générés | Élagage `ENGINE_ONLY` + motifs d'identités étrangères bloquants dans le contrôle de fuite (le nom du site généré est exclu de ces motifs)    |
| Palettes onyx/atelier sous le seuil AA (badge mesuré à 3,77:1 par axe)             | Maths de contraste (`src/ace/config/contrast.ts`) + tests « AA par construction » sur chaque preset, seuil 4,7:1 (marge de rendu navigateur) |
| Le switcher de presets du Lab supposait un site en neutral                         | Initialisation sur le preset du site + émission systématique des tokens                                                                      |
| Titres SplitText jamais révélés visuellement (observer sur mot clippé → ratio 0)   | Observer déplacé sur le conteneur + stagger par variants ; garde-fou e2e sur l'opacité calculée                                              |

MapLibre sur GL logiciel (headless) sature un hôte 2 cœurs : les specs `/lab`
restent isolées dans leur propre projet Playwright, workers en série, budgets
de temps élargis. Aucun impact sur appareils réels (GPU matériel).

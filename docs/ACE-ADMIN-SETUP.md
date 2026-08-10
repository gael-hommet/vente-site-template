# ACE — Configuration administrateur (une seule fois)

Cette page s'adresse à **une seule personne** : celle qui prépare le Codespace
ACE. Les utilisateurs finaux (Lou, vos parents, un commercial…) n'ont **jamais**
à la lire ni à exécuter quoi que ce soit d'ici.

> **Sans cette configuration, ACE fonctionne déjà.** Il crée des sites complets
> avec les visuels que l'utilisateur fournit. Ce qu'elle ajoute, c'est la
> **génération d'images et de vidéos par IA** quand aucun visuel n'existe.

## 1. Vérifier l'état

```bash
pnpm ace:doctor
```

| Ce que vous lisez       | Signification                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| `ACE READY`             | Tout est prêt, y compris la génération de médias. Rien à faire.                                              |
| `ACE NEEDS ADMIN SETUP` | Les sites se créent déjà ; la génération IA demande les étapes ci-dessous.                                   |
| `ACE NOT READY`         | Un élément **essentiel** manque (Node, pnpm, ffmpeg…). Le détail est affiché avec la commande de correction. |

## 2. Installer le CLI officiel du fournisseur

ACE pilote Higgsfield par son **CLI officiel** `hf-api`, conçu pour être opéré
par un agent autonome :

```bash
npm i -g @higgsfield/cloud-cli
hf-api --version
```

> ACE ne déclare **pas** ce paquet en dépendance du projet : le fournisseur doit
> rester optionnel et `pnpm install` ne doit pas dépendre d'un téléchargement
> externe.

Binaire installé ailleurs ? Indiquez son chemin :

```bash
export HF_API_BIN=/chemin/vers/hf-api
```

## 3. Authentifier — sans jamais écrire la clé dans le dépôt

La clé a le format `<api_key_id>:<secret>`. **Deux voies, au choix.**

### Voie A — stockage par le CLI (poste personnel)

```bash
hf-api auth login
```

### Voie B — secret de Codespace (recommandé en équipe)

1. GitHub → dépôt → **Settings → Secrets and variables → Codespaces**.
2. **New repository secret** :
   - nom : `HIGGSFIELD_API_KEY`
   - valeur : `<api_key_id>:<secret>`
3. Rebuild du Codespace. La variable est injectée dans l'environnement ; ACE la
   lit via `process.env`.

Tous les utilisateurs du Codespace bénéficient alors du fournisseur **sans
aucune manipulation**, dans la limite des permissions du secret.

### Ce qu'ACE ne fait jamais avec vos credentials

- il ne les **écrit** nulle part dans le dépôt (`.env*` est gitignoré) ;
- il ne les **lit pas** depuis un fichier `.env` — uniquement `process.env` ;
- il ne les passe **jamais** en argument de ligne de commande (cela fuiterait
  dans la table des processus) ;
- il n'en **affiche jamais la valeur**, seulement la présence.

## 4. Contrôler

```bash
pnpm ace:provider:check
pnpm ace:doctor
```

Attendu : `READY`, puis `ACE READY`.

## 5. Fixer le budget

Les garde-fous de dépense vivent dans **`src/config/ace-autopilot-policy.ts`** :

| Réglage                 | Défaut                    | Rôle                                                                            |
| ----------------------- | ------------------------- | ------------------------------------------------------------------------------- |
| `approvalThreshold`     | `5`                       | Au-dessus, ACE pose **une** question avant de dépenser.                         |
| `hardCap`               | `50`                      | Plafond absolu : la mission s'arrête, même approuvée.                           |
| `maxGenerationsPerSite` | `24`                      | Garde-fou anti-emballement.                                                     |
| `maxAttemptsPerShot`    | `3`                       | Tentatives par plan avant abandon.                                              |
| `whenUnavailable`       | `block-if-media-required` | Sans fournisseur : bloquer proprement plutôt que livrer un visuel bas de gamme. |

Ajustez ces valeurs **avant** de confier le Codespace à quelqu'un d'autre.

## 6. Navigateur pour la relecture visuelle

La relecture visuelle (captures desktop + mobile) utilise Playwright :

```bash
pnpm exec playwright install chromium
```

## Dépannage

| `ace:doctor` affiche              | À faire                                  |
| --------------------------------- | ---------------------------------------- |
| `Provider média : CLI installé ✗` | `npm i -g @higgsfield/cloud-cli`         |
| `Provider média : authentifié ✗`  | `hf-api auth login` ou définir le secret |
| `ffmpeg ✗` / `ffprobe ✗`          | `sudo apt-get install -y ffmpeg`         |
| `Navigateur ✗`                    | `pnpm exec playwright install chromium`  |
| `Port 3000 déjà utilisé`          | arrêter le serveur qui l'occupe          |

## Voir aussi

- [ACE-AUTOPILOT.md](ACE-AUTOPILOT.md) — le parcours utilisateur.
- [ACE-HIGGSFIELD-SETUP.md](ACE-HIGGSFIELD-SETUP.md) — détail du contrat CLI.
- [ACE-COST-GUARD.md](ACE-COST-GUARD.md) — comment les coûts sont bornés.

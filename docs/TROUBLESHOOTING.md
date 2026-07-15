# Dépannage

Problèmes fréquents et corrections. Rappel : gestionnaire **pnpm 10.32 uniquement**, jamais `--force` ni `--legacy-peer-deps`.

---

## Le port 3000 ne se forwarde pas

- `pnpm dev` bind sur `0.0.0.0:3000` (nécessaire pour que Codespaces l'expose).
- Ouvrir l'onglet **PORTS** du Codespace : le port 3000 doit apparaître. Ouvrir l'**URL forwardée**.
- Si le port est absent : vérifier que `pnpm dev` tourne, puis **Add Port → 3000** manuellement.
- Si l'URL renvoie une erreur d'auth : passer la visibilité du port sur **Public** (ou rester connecté au bon compte GitHub).

## Canvas WebGL blanc / noir

- Cause probable : contexte WebGL indisponible, erreur d'init, ou tier mal détecté.
- Vérifier que le composant 3D est bien **client-only** (`ssr: false`) — **pas de WebGL en SSR**.
- Vérifier qu'un **poster** s'affiche : le chemin de fallback doit prendre le relais (tier **LITE**) au lieu d'un canvas noir.
- Tester le forçage du tier **LITE** via le sélecteur UI pour valider le fallback.
- Console : chercher les erreurs de shader / de perte de contexte (`context lost`).

## `pnpm build` : OOM sur un petit Codespace

- Le build 3D + Turbopack peut saturer la RAM d'une petite machine.
- Augmenter la mémoire Node : `NODE_OPTIONS=--max-old-space-size=4096 pnpm build`.
- Sinon, utiliser un Codespace de type supérieur (plus de RAM).
- Fermer `pnpm dev` avant de lancer le build pour libérer de la mémoire.

## Navigateurs Playwright manquants

- Symptôme : les E2E échouent avec un navigateur introuvable.
- Correction : `pnpm exec playwright install` (ajouter `--with-deps` si des libs système manquent).
- Relancer `pnpm test:e2e` / `pnpm test:a11y`.

## ffmpeg absent

- **ffmpeg provient du devcontainer** : dans un Codespace correctement provisionné, il est présent.
- Si `assets:video` échoue faute de ffmpeg (env local hors devcontainer) : ouvrir le projet dans le **Codespace/devcontainer**, ou installer ffmpeg sur la machine.
- Vérifier : `ffmpeg -version`.

## Les animations n'apparaissent pas (reduced-motion)

- Ce n'est pas un bug : si `prefers-reduced-motion: reduce` est actif, le moteur **honore** ce réglage et bascule vers un rendu apaisé (tier tendant vers LITE, animations réduites).
- Pour tester le rendu complet : désactiver reduced-motion dans les préférences système/navigateur, ou forcer un tier supérieur via le sélecteur UI.

## Dérive de version des peers React

- Symptôme : avertissements d'install, rendu 3D instable.
- Cause : `react`/`react-dom` désalignés ou > 19.2 (le pin est `<19.3`).
- Correction : réaligner sur **19.2.4**, `react` et `react-dom` identiques. **Ne pas** masquer avec `--force`/`--legacy-peer-deps`.
- Vérifier les intégrations optionnelles qui exigeraient un React plus récent ou embarqueraient leur propre `three` (`pnpm why three`, `pnpm why react`).

## `claude` introuvable après reconstruction du Codespace

- Le dev container relance `scripts/post-create.sh` (idempotent) qui installe
  Claude Code et l'ajoute à un **PATH persistant** (`~/.local/bin`, écrit dans
  `~/.bashrc` / `~/.profile`).
- Si `claude` manque malgré tout : ouvrir un **nouveau terminal** (PATH
  rechargé), ou relancer `bash scripts/post-create.sh`.
- Réinstallation manuelle : `curl -fsSL https://claude.ai/install.sh | bash`
  (repli : `npm install -g @anthropic-ai/claude-code`).
- Pour reprendre le travail sans la conversation perdue : lire
  `docs/RECOVERY-STATUS.md` puis `pnpm install && pnpm check`. La reprise se
  fonde sur le dépôt + Git, jamais sur l'historique de conversation.

## Avertissement Git LFS au commit

- Message : « This repository is configured for Git LFS but 'git-lfs' was not
  found ». **Bénin** : aucun asset LFS n'est requis, le commit aboutit.
- Pour le supprimer : installer `git-lfs`, ou retirer le hook
  `post-commit` du dépôt si LFS n'est pas utilisé.

## Une classe Tailwind v4 ne s'applique pas

- Tailwind v4 est **CSS-first** : les tokens sont des **variables CSS**, pas un `tailwind.config.js` classique.
- Vérifier que le fichier est bien couvert par le scan de contenu et que le plugin `@tailwindcss/postcss` est actif.
- Éviter les **noms de classes construits dynamiquement** par concaténation (non détectés au build) ; utiliser des classes complètes + `cva`/`clsx`/`tailwind-merge`.
- Après ajout de tokens, redémarrer `pnpm dev` pour recompiler le CSS.

---
name: preview-site
description: Lance le serveur de développement et explique comment ouvrir la preview dans Codespaces (port 3000 auto-forwardé). À utiliser via /preview-site quand l'utilisateur veut voir le site.
---

# /preview-site — Lancer la preview

## Étapes
1. Vérifie que les dépendances sont installées (`node_modules` présent) ; sinon
   `pnpm install` (pnpm uniquement, jamais `--force`).
2. Démarre le serveur en arrière-plan :
   - Dév (rapide, HMR) : `pnpm dev` — écoute sur `0.0.0.0:3000`.
   - Prod (représentatif) : `pnpm build && pnpm start`.
3. Dans Codespaces, le **port 3000** est auto-forwardé. Indique clairement à
   l'utilisateur :
   - Ouvrir l'onglet **PORTS** de VS Code et cliquer sur l'URL du port 3000, ou
   - Utiliser la notification « Open in Browser » qui apparaît au démarrage.
4. Donne les deux routes clés :
   - `/` — tableau de bord du moteur (ou le site client une fois construit).
   - `/lab` — laboratoire des démonstrations techniques.

## Bon à savoir
- Si le port 3000 est occupé, arrête l'ancien process ou change de port
  (`next dev -p 3001`) et re-forwarde.
- La preview est **privée** au Codespace tant que la visibilité du port n'est pas
  changée. Ne rends pas le port public sans ordre explicite.
- Ne déploie rien. Cette skill ne fait que servir localement.

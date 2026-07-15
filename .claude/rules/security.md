---
description: Sécurité — pnpm strict, secrets, .env gitignored, pas de déploiement/push sans ordre, pas de hooks dangereux.
---

# Sécurité, secrets & déploiement

## Gestionnaire de paquets

- **pnpm uniquement.** Interdit : `--force`, `--legacy-peer-deps` et tout contournement de résolution.
- Respecter le lockfile ; ne pas bidouiller les versions pour forcer une install (rappel : React épinglé `<19.3`).

## Secrets

- **Ne jamais committer de secrets** (clés API, tokens, identifiants).
- Tous les fichiers `.env*` sont **gitignored**. Fournir un `.env.example` sans valeurs sensibles.
- Ne pas logguer de secrets ; ne pas les inclure dans le bundle client.

## Permissions

- Pas de contournement global des permissions. Ne pas élargir les droits ou désactiver les protections.

## Déploiement et services externes

- **Ne jamais déployer ni pousser vers un service externe sans ordre explicite** de l'utilisateur.
- Pas de hook qui déploie, push, supprime, publie, ou qui lit/envoie des secrets.
- Les intégrations tierces restent **env-gated** et désactivées par défaut.

## Intégrité du contenu

- Ne jamais inventer d'infos client : avis, notes, prix, promos, certifications, récompenses, résultats, adresses. Utiliser `business.ts` comme source de vérité et laisser vide si l'info n'est pas fournie.

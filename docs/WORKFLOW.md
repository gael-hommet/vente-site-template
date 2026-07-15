# Workflow de bout en bout

Ce document décrit le parcours complet : du clic **« Use this template »** jusqu'à la **démo privée** livrée au client. Le moteur est conçu pour être piloté depuis Claude Code à l'aide de **skills** (commandes `/…`) qui délèguent le travail à des **agents** spécialisés.

---

## Vue d'ensemble

```
Use this template  →  nouveau Codespace  →  remplir le brief  →  /build-site
     →  preview  →  /audit-site  →  corrections  →  /finalize-site  →  démo privée
```

---

## 1. « Use this template » → nouveau Codespace

1. Sur GitHub, cliquer **Use this template** pour créer un dépôt client dédié (un site = un dépôt).
2. Ouvrir le dépôt dans un **Codespace**. Le `.devcontainer/` prépare l'environnement : Node 22, `pnpm`, `ffmpeg`, navigateurs Playwright, et l'installation des dépendances.
3. Vérifier que l'environnement est prêt (`pnpm install` déjà exécuté par le devcontainer).

## 2. Remplir le brief client

1. Éditer **`input/CLIENT_BRIEF.md`** : secteur, identité, ton, objectifs de conversion, informations vérifiées (adresse, horaires, prestations, contacts).
2. Déposer les fichiers fournis par le client dans **`input/assets/`** (logos, photos, vidéos, modèles 3D…).

> Règle absolue : n'inscrire dans le brief que des **faits vérifiés**. Aucun avis, note, prix, récompense ou adresse inventé (voir `docs/SEO-GUIDE.md`).

## 3. Lancer Claude Code

Depuis le terminal du Codespace : `claude`. On pilote ensuite la génération avec les skills ci-dessous.

---

## Les skills

### `/ingest-assets`

Ingère `input/assets/` et déclenche les pipelines `assets:*` (sharp, ffmpeg, @gltf-transform) pour produire les dérivés optimisés dans `public/`. Ne modifie jamais les originaux ; génère un rapport. Détail : `docs/ASSET-PIPELINE.md`.

### `/build-site`

Génère le site à partir du brief et des assets ingérés. C'est l'étape principale. Elle délègue à la chaîne d'agents :

- **business-researcher** — analyse le secteur et le contexte concurrentiel.
- **conversion-strategist** — définit les objectifs et parcours de conversion.
- **copywriter** — rédige les textes (dans le respect des faits vérifiés).
- **art-director** — direction artistique, palette, typographie, tokens.
- **experience-director** — orchestration des animations et du parcours d'expérience.
- **three-director** — conception des scènes 3D / WebGL et des tiers de qualité.
- **seo-engineer** — métadonnées, JSON-LD, sitemap/robots.
- **performance-engineer** — respect des budgets de performance.
- **accessibility-reviewer** — accessibilité (reduced-motion, contrastes, sémantique).

### `/preview-site`

Prépare et lance la prévisualisation locale (`pnpm dev`) pour visualiser le rendu.

### `/audit-site`

Passe le site au crible : lint, typecheck, tests, build, audits SEO/perf/a11y (`audit:site`). Produit un rapport de conformité et signale les corrections à apporter. Délègue principalement à **qa-engineer**, **performance-engineer**, **accessibility-reviewer** et **seo-engineer**.

### `/finalize-site`

Verrouille la livraison une fois l'audit vert : contrôles finaux, checklist de « Definition of Done » (voir `docs/DEFINITION-OF-DONE.md`), préparation de la démo privée.

---

## 4. Preview

- `pnpm dev` bind sur `0.0.0.0:3000`.
- Codespaces **forward automatiquement le port 3000**.
- Ouvrir l'URL forwardée depuis l'onglet **PORTS**.

## 5. `/audit-site` → corrections

Boucler : lancer `/audit-site`, corriger les points remontés (qualité, perf, a11y, SEO), relancer jusqu'au vert. La commande `pnpm check` (= `lint` + `typecheck` + `test` + `build`) est la porte de sortie technique.

## 6. `/finalize-site` → démo privée

Une fois l'audit propre et la Definition of Done satisfaite, `/finalize-site` prépare la **démo privée** à présenter au client.

---

## Récapitulatif des scripts pnpm

`dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:watch`, `test:e2e`, `test:a11y`, `check` (=lint+typecheck+test+build), `format`, `format:check`, `audit:site`, `assets:audit`, `assets:images`, `assets:video`, `assets:models`, `assets:all`.

# ACE AUTOPILOT — rapport final honnête

Document **interne au moteur** (élagué à la génération). Clôture du chantier
« one-prompt website creation ». Règle : rien n'est déclaré fonctionnel sans
avoir été **exécuté ici**.

## 1. UX exacte d'un utilisateur non technique

1. Ouvrir le Codespace ACE (tout s'installe seul).
2. Taper `pnpm ace:doctor` → lire **`ACE READY`**.
3. Lancer `claude`.
4. Écrire **une phrase**.
5. Répondre éventuellement à **une** question (accord de dépense, ou nom de
   l'entreprise si vraiment introuvable).
6. Recevoir : « Le site est prêt. » + l'aperçu + ce qui reste à confirmer.

Il n'a jamais à connaître pnpm, Next.js, ffmpeg, WebGL, les tiers de qualité,
les manifestes, les tests ni une seule commande `ace:*`.

## 2. Exemple de prompt d'une ligne

```
Fais-moi un site premium pour Atelier Nova, une entreprise de mobilier sur mesure.
Moderne, chaleureux, très haut de gamme.
```

## 3. Commandes qu'ACE a exécutées seul

Relevées dans le rapport technique de la mission d'acceptation :

```
node scripts/ace/new-site.mjs --name "Atelier Nova" --slug atelier-nova --out /workspaces/atelier-nova
pnpm exec prettier --write <site>/src/config/site-content.ts
pnpm install --frozen-lockfile      (dans le site généré)
pnpm run lint · typecheck · test · build   (dans le site généré)
```

L'utilisateur n'en a tapé aucune.

## 4. Doctor

`pnpm ace:doctor` → **`ACE NEEDS ADMIN SETUP`** (exit 2) sur cette machine :
14 contrôles, tous verts sauf les deux lignes provider. Essentiels (Node, pnpm,
dépendances, git, écriture, ffmpeg, ffprobe, sharp) : **tous OK** — ACE peut
donc créer des sites dès maintenant.

## 5. Provider

**Non configuré.** `hf-api` n'est pas installé ici → `PROVIDER_NOT_CONFIGURED`.
Aucune génération d'image/vidéo n'a été exécutée, et **aucune n'a été simulée**.
Activation = tâche ADMIN unique ([ACE-ADMIN-SETUP.md](ACE-ADMIN-SETUP.md)).

## 6. Tests Autopilot

**33 tests** (`tests/unit/autopilot.test.ts`) : détection d'intention (dont le
non-déclenchement sur une question ordinaire, et le refus d'inventer un nom
depuis « ce restaurant »), direction artistique (validité de **toutes** les
recipes contre le catalogue réel), garde-fous, machine à états, rapports.

Suite complète : **282 tests**, lint et typecheck sans avertissement, build OK.

## 7. Test de reprise (TEST 4)

Vérifié **en réel**, pas seulement en unitaire :

```
mission interrompue  → état persisté : bistrot-test · CONTENT (36 %)
étapes déjà validées : INTAKE, RESEARCH, FACT_CHECK, SITE_BOOTSTRAP, ART_DIRECTION
pnpm ace:resume      → « Reprise de bistrot-test à l'étape CONTENT »
```

Le projet déjà généré n'est pas refait. Aucune reprise depuis zéro.

## 8. Test de coûts (TEST 5)

- sous `approvalThreshold` (5) → automatique, aucune question ;
- au-dessus → `WAITING_FOR_APPROVAL`, **une** question en français ;
- coût **inconnu** → traité comme au-dessus du seuil, jamais comme gratuit ;
- au-dessus de `hardCap` (50) → refus même si approuvé.

## 9. Test d'élagage du site généré (TEST 7)

Un site généré ne contient **ni** `src/ace/autopilot`, **ni**
`ace-autopilot-policy.ts`, **ni** `scripts/ace/autopilot`, **ni** les fixtures,
**ni** `.ace/`, **ni** les docs Autopilot ; aucun script `ace:autopilot` /
`ace:doctor` / `ace:resume` ne subsiste dans son `package.json`. Un test vérifie
en plus qu'aucun fichier conservé n'importe la couche élaguée.

## 10. Acceptation « one-prompt »

Parcours complet exécuté depuis **une seule phrase** + un dossier d'assets :

| Étape             | Résultat                                                                        |
| ----------------- | ------------------------------------------------------------------------------- |
| Projet créé       | `/workspaces/atelier-nova` (générateur réel)                                    |
| Direction choisie | éditorial premium sobre, hero promu `media-first` car de vraies photos existent |
| Contenu           | rédigé depuis les faits vérifiés ; 2 champs laissés `[À CONFIRMER]`             |
| Média             | assets du client câblés (hero + collection) ; **aucune** génération nécessaire  |
| Desktop / mobile  | captures réelles Playwright, 2 passes                                           |
| QA technique      | lint ✓ typecheck ✓ test ✓ build ✓ **dans le site généré**                       |
| Preview           | `HTTP 200` sur le serveur du site généré                                        |
| Rapport           | utilisateur (sans jargon) + technique                                           |

**La boucle visuelle a réellement servi** : passe 1 notée 0.6 avec le défaut
« les 3 visuels fournis n'apparaissent nulle part » → correction (câblage des
assets + direction artistique sensible aux assets) → passe 2 à 0.78, validée.

## 11. Tâches ADMIN restantes

1. `npm i -g @higgsfield/cloud-cli`
2. `hf-api auth login` **ou** secret Codespace `HIGGSFIELD_API_KEY`
3. Ajuster `src/config/ace-autopilot-policy.ts` (seuils) avant de confier le
   Codespace à quelqu'un d'autre.

Après quoi `ace:doctor` doit afficher **`ACE READY`**.

## 12. Sécurité public-ready

- Aucun secret committé ; aucune lecture de fichier `.env` ; credential jamais
  passé en argument ; jamais affiché.
- **Identité client réelle anonymisée** (« Site témoin A ») dans les 10 documents
  et l'empreinte concernés — sans détruire la preuve : la comparaison
  anti-template rend le même verdict et ses 7 tests passent.
- Plus aucune occurrence d'une identité client dans les fichiers suivis.
- Aucun chemin local personnel restant dans les docs.
- `.ace/` (état de mission) est gitignoré.

## 13. Version

`0.2.0` → **`0.2.1`**. Pas de bump majeur : Autopilot est ce que « 0.2 » devait
signifier (moteur média + orchestration provider + autonomie utilisateur). Le
contrat des sites générés est inchangé (Autopilot est élagué) → patch.

## 14. Commits

| Commit      | Contenu                                                                        |
| ----------- | ------------------------------------------------------------------------------ |
| `04d5d25`   | Autopilot : types, intention, états, gates, DA autonome, rapports, CLI, doctor |
| `537dfdf`   | CLAUDE.md OPERATOR MODE, README trois publics, docs, élagage, anonymisation    |
| (ce commit) | Changelog, version 0.2.1, rapport final                                        |

## 15. État git

Branche `main`, arbre **propre**. **Aucun push, aucun déploiement, aucun
domaine** — conformément à la politique d'autonomie.

---

## Ce qui n'est PAS prouvé (honnêteté)

1. **Génération IA** : jamais exécutée (aucun credential). Le chemin refuse
   proprement ; il n'est pas validé de bout en bout.
2. **Recherche web réelle** : l'acceptation utilise une fixture locale explicite.
   Le parcours avec vraie recherche publique dépend de l'agent, pas du script.
3. **Rendu « très haut de gamme »** : les assets de la fixture sont des dégradés
   synthétiques. La mise en page est correcte ; le rendu final avec de vraies
   photos reste à évaluer.
4. **`MEDIA_QA` / `SITE_BUILD` / `MOBILE_QA`** sont traversés sans traitement
   propre (le travail réel est fait par `TECHNICAL_QA` et le media-engine) :
   ce sont des jalons de traçabilité, pas des étapes actives.
5. **Score visuel** : fourni par l'agent qui regarde les captures. Aucun modèle
   de vision n'est branché dans le pipeline ; `REVIEW_REQUIRED` reste la sortie
   par défaut.

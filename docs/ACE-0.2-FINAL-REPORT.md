# ACE 0.2 — Rapport final honnête (Creative Media Autonomous Engine)

Document **interne au moteur** (élagué à la génération). Rapport de clôture,
**sans complaisance** : ce qui est réel, ce qui est prouvé, ce qui ne l'est pas.

> Règle de ce rapport : une capacité n'est « fonctionne » que si elle a été
> **exécutée et vérifiée ici**. Tout le reste est marqué comme non prouvé.

## 1. Version avant

`ACE_VERSION = "0.1.0"` (package.json `0.1.0`).

## 2. Version après

`ACE_VERSION = "0.2.0"` (package.json `0.2.0`). Bump effectué **après**
vérification de la Definition of Done (§22 du mandat) — voir §19.

## 3. Commits créés

| Commit      | Contenu                                                                                                                                 |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `12c1e8d`   | Provider officiel hf-api, orchestrateur, router, gate premium, budget, manifeste, reference lock, art direction, QA ffprobe (+23 tests) |
| `a1c1415`   | CLI `generate` / `qa` / `assemble` / `optimize` + alignement `capabilities`/`provider:check`/`report`                                   |
| `24af9d0`   | Continuité v2 (fichiers réels), mode de diffusion, Scroll Cinema v2, pipeline E2E (+20 tests)                                           |
| (ce commit) | Docs à jour, élagage générateur, bump 0.2.0, changelog, rapport                                                                         |

## 4. Modules créés

**Isomorphes** (shippés dans les sites générés) : `model-router.ts` ·
`reference-lock.ts` · `premium-gate.ts` · `art-direction.ts` · `budget.ts` ·
`manifest.ts` · `orchestrator.ts` · `delivery-mode.ts` · `qa-verdict.ts`.

**Node uniquement** (outillage moteur, élagué) : `node/hf-cli.ts` ·
`node/provider-runtime.ts` · `node/technical-qa.ts` · `node/continuity.ts`.

**CLI** : `scripts/ace/media/{generate.ts, qa.ts, assemble.mjs, optimize.mjs}`.

## 5. Commandes réellement fonctionnelles

Toutes exécutées et vérifiées dans cet environnement :

| Commande                 | Preuve                                                                        |
| ------------------------ | ----------------------------------------------------------------------------- |
| `ace:media:capabilities` | ✅ rapporte ffmpeg/ffprobe/sharp/gltf ✓, higgsfield `PROVIDER_NOT_CONFIGURED` |
| `ace:media:plan`         | ✅ `--demo` → `editorial-fallback` + `PROVIDER_NOT_CONFIGURED`, exit 1        |
| `ace:media:qa`           | ✅ 3 rushes `PASS` ; média corrompu → `REJECT`, exit 1                        |
| `ace:media:assemble`     | ✅ 3×2 s → master **6.00 s**, concat _sans recompression_ + webm + poster     |
| `ace:media:optimize`     | ✅ desktop −12 %/−32 %, mobile −50 %/−51 %, upscale refusé                    |
| `ace:media:frames`       | ✅ 48 frames webp extraites                                                   |
| `ace:media:report`       | ✅ rapport can/can't complet                                                  |
| `ace:provider:check`     | ✅ exit 3 sans CLI ; `PROVIDER_AUTH_PENDING` avec le VRAI binaire             |
| `ace:media:generate`     | ✅ **exit 3** sans CLI · **exit 4** avec le vrai CLI non authentifié          |

## 6. Provider réel configuré : **NON**

Le CLI officiel `hf-api` a été téléchargé et **réellement exécuté** (v0.1.2,
build 2026-07-16) pour capturer son contrat, mais **aucune clé API n'est
disponible** dans cet environnement.

## 7. Génération IA réellement exécutée : **NON**

Aucune image, aucune vidéo n'a été générée.

## 8. Raison exacte

`hf-api auth status` renvoie `Error: Not authenticated.` (**exit 2**). Sans clé
`<api_key_id>:<secret>`, ACE refuse de générer et retourne
`PROVIDER_AUTH_PENDING` (exit 4). **Aucune génération n'a été simulée** pour
masquer cette absence — c'était l'exigence n°1 du mandat.

## 9. Tests pipeline local

**12 tests** (`media-pipeline-e2e.test.ts`), média synthétique ffmpeg, coût nul :
faits techniques réels · rejet d'un fichier corrompu et d'un fichier absent ·
contrainte de dimensions · **rupture de continuité détectée** · coupe volontaire
non pénalisée · assemblage (durée = somme) · **refus d'assembler sans sortie
approuvée** · optimisation sans upscale · extraction de frames · CLI QA exit 1/0
· refus du média de test comme livrable premium · rapport ffprobe traçable.

## 10. Tests provider

**Statut : `PROVIDER_AUTH_PENDING`.** Vérifié avec le vrai binaire officiel :
détection du CLI, lecture du statut d'authentification, codes de sortie honnêtes
(3 / 4). Le chemin de génération lui-même **n'est pas validé de bout en bout** —
il n'est donc PAS marqué VALIDATED.

## 11. Anti-low-poly

Doctrine intacte et testée : WebGL + barre photoréaliste + aucun modèle 3D réel
⇒ exception ; `chooseStrategy` renvoie `editorial-fallback` + blocker avec la
mention « ACE ne bricole PAS de low-poly ». Vérifié aussi via la CLI.

## 12. Premium output gate

`premium-gate.ts` : 8 violations couvertes (low-poly, média manquant, corrompu,
QA rejetée, asset de test, placeholder, verrou rompu, repli silencieux) et
3 actions (`SHIP` / `DECLARE_FALLBACK` / `BLOCK`). Un site peut fonctionner avec
un repli ; un repli **déguisé** en premium est refusé.

## 13. Reference lock

`research/media/<subject-id>/` avec `reference-lock.json`. Invariants,
contraintes négatives, références sources et approuvées. La sortie approuvée du
plan N devient la référence forte du plan N+1 (vérifié par test). Un lock trop
pauvre est signalé inexploitable.

## 14. Continuité

V2 sur **fichiers réels** : extraction des frames de raccord + SSIM + écart de
couleur moyenne. **Calibration mesurée, pas supposée** — et elle a invalidé
l'approche naïve : deux images sans aucun rapport ont scoré SSIM **0.155** dans
un cas et **0.657** dans l'autre. Conclusion codée : ne jamais conclure sur le
SSIM seul ; deux signaux doivent concorder, sinon `REVIEW_REQUIRED`.

## 15. QA visuelle

**Non automatisée, et c'est dit partout.** Un modèle de vision n'est pas branché
dans le pipeline. `art-direction.ts` fournit la structure du jugement ; sans
scores fournis, le verdict est `REVIEW_REQUIRED` — **jamais** `APPROVE`. Un
`PASS` technique n'est pas une promesse esthétique.

## 16. Cost guard

Estimation _a priori_ (`cost.ts`) + **dépense consommée** (`budget.ts`) : plafond
`maxSpend`, `maxAttemptsPerShot` (défaut 3), `maxTotalGenerations`, refus
`WOULD_EXCEED_MAX_SPEND` avant dépense, arrêt net du run. Un coût non communiqué
est `null` — jamais `0` : le total est marqué **minorant**. `--yes` obligatoire
pour dépenser, `--dry-run` pour estimer seulement.

## 17. Scroll cinema

Complété sans réécriture : calque poster `next/image` jusqu'à la première image
décodée (**plus de flash noir**), `onProgress` exposé, chapitres **réellement
synchronisés** (`aria-current="step"`), sources mobiles dédiées, reduced-motion
et CTA atteignable préservés. Arbitrage `VIDEO_SCROLL` / `IMAGE_SEQUENCE` chiffré.

## 18. Public readiness

✅ Aucun secret en dur · aucune lecture de `.env` (uniquement `process.env`) ·
la clé n'est **jamais** passée en argument CLI · aucune valeur de credential
loguée · provider **optionnel** (sans lui le moteur reste pleinement utilisable)
· aucun artefact de test lourd committé · aucun push, aucun déploiement.

⚠️ **Une réserve, signalée et non corrigée unilatéralement** :
`docs/anti-template/temoin-a-fingerprint.json` et
`scripts/ace/compare-creative-fingerprints.mjs` contiennent le **nom d'un client
réel** (« Site témoin A ») et la description de son parti-pris visuel. Aucun secret,
aucune coordonnée. Ces fichiers sont **élagués des sites générés** (donc aucune
fuite vers un client), mais ils resteraient présents si **le moteur lui-même**
était publié. Pré-existant à ce chantier et utilisé par la validation
anti-template : à arbitrer (anonymiser en « site témoin A » ou retirer du dépôt
public). Je ne l'ai pas supprimé de ma propre initiative pour ne pas casser
cette validation.

## 19. Tests finaux

`pnpm check` **vert** : lint **0 warning** · typecheck · **248 tests** (27
fichiers) · build. Générateur : **26 tests** verts, et un site généré
**typecheck sans erreur** avec le runtime média conservé et la couche Node
élaguée.

Definition of Done §22 : **A→R satisfaits**, avec la nuance explicite du point H
(`generate` retourne correctement `PROVIDER_NOT_CONFIGURED` /
`PROVIDER_AUTH_PENDING` sans simulation, faute de credential).

## 20. Éléments encore NON prouvés

1. **Génération IA réelle** — jamais exécutée (pas de credential). Le code est
   écrit et refuse proprement ; il n'est pas validé contre l'API.
2. **Schéma JSON des réponses** (`models`, `estimate`, `generate`) — extracteurs
   tolérants, mais à confirmer à la première authentification. En cas d'échec :
   `HF_SCHEMA_UNVERIFIED`, jamais un faux succès.
3. **Téléchargement des sorties** — `downloadTo()` n'a jamais tourné sur une
   vraie URL de provider.
4. **Model router sur catalogue réel** — testé sur des catalogues fabriqués ;
   jamais sur la vraie sortie de `hf-api models`.
5. **QA visuelle** — non automatisée (pas de modèle de vision branché).
6. **Continuité fine d'identité** — SSIM et couleur détectent les ruptures
   franches, pas une dérive subtile (poignée de porte, matériau).
7. **Coûts chiffrés** — aucun tarif réel observé ; `estimate`/`usage` non
   exécutés авec authentification.
8. **Scroll Cinema v2 en navigateur réel** — couvert en jsdom (chapitres,
   fallback, CTA) ; le rendu du calque poster et l'absence de flash noir n'ont
   pas été validés visuellement dans un vrai navigateur.

## Prochaine passe recommandée

1. Authentifier `hf-api`, lancer **un** `--dry-run` puis **une** génération
   minimale, confirmer les schémas et affiner les extracteurs.
2. Brancher un inspecteur visuel (modèle de vision) sur `art-direction.ts`.
3. Arbitrer la réserve du §18 avant toute publication du moteur.

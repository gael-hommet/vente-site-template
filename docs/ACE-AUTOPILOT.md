# ACE AUTOPILOT — une phrase suffit

Document **interne au moteur** (élagué à la génération). Décrit la couche qui
rend ACE utilisable par une personne non technique.

## Le principe

L'utilisateur écrit **une phrase**. ACE fait le reste.

```
« Fais-moi un site premium pour ce restaurant : https://exemple.fr »
```

AUTOPILOT ne remplace rien : il **commande** l'existant (générateur de sites,
media-engine, pipeline d'assets, tests, build). Il apporte ce qui manquait : une
**machine à états persistante**, des **garde-fous**, et deux niveaux de rapport.

## Répartition des rôles — honnête et explicite

Un script ne sait pas chercher une entreprise sur le web, ni rédiger, ni juger
si une page est belle. AUTOPILOT ne prétend pas le contraire :

| Fait par le SCRIPT (déterministe)                   | Fait par l'AGENT (Claude)            |
| --------------------------------------------------- | ------------------------------------ |
| machine à états, persistance, reprise               | recherche publique sourcée           |
| exécution des commandes (générateur, build, tests)  | rédaction éditoriale                 |
| garde-fous (visuels, droits, faits, qualité)        | jugement visuel sur captures réelles |
| direction artistique de base (secteur → parti-pris) | affinage créatif                     |
| rapports utilisateur / technique                    | —                                    |

Quand le script a besoin de l'agent, il s'arrête avec `NEEDS_AGENT <ÉTAT>` et
**sort en code 3**. Il n'invente jamais la contribution manquante.

## Machine à états

```
INTAKE → RESEARCH → FACT_CHECK → ASSET_DISCOVERY → ASSET_VALIDATION
       → ART_DIRECTION → CONTENT → MEDIA_PLAN → MEDIA_PROCESSING
       → SITE_BUILD → VISUAL_QA → MOBILE_QA → TECHNICAL_QA → PREVIEW → COMPLETE

états terminaux : COMPLETE · BLOCKED

La direction artistique vient APRÈS l'analyse des vrais visuels : on ne décide
pas d'un parti-pris avant d'avoir vu le matériau.
```

L'état est persisté dans `.ace/missions/<id>.json` (gitignoré). Une coupure de
session ne fait **jamais** repartir de zéro : `pnpm ace:resume` reprend à
l'étape suivant la dernière étape **réussie**.

## Commandes

```bash
pnpm ace:doctor                                   # l'environnement est-il prêt ?
pnpm ace:autopilot --brief "<phrase>" [--assets <dir>]
pnpm ace:autopilot status                         # où en est-on ?
pnpm ace:autopilot run                            # avancer au maximum
pnpm ace:autopilot supply --state <S> --file <f>  # apport de l'agent
pnpm ace:resume                                   # reprendre après coupure
pnpm ace:autopilot report [--technical]
```

Codes de sortie : `0` avancé/terminé · `2` usage · `3` besoin de l'agent ·
`4` bloqué.

## Ce que l'agent doit fournir

### ASSET_DISCOVERY

**CHERCHER D'ABORD, demander seulement si rien n'existe.** Inventaire attendu :

```json
{
  "usage": "PRIVATE_DEMO",
  "assets": [
    {
      "path": "atelier-01.jpg",
      "source": "OFFICIAL_WEBSITE",
      "sourceRef": "https://exemple.test/atelier",
      "nature": "REAL",
      "role": "hero",
      "kind": "image",
      "alt": "L'atelier",
      "rights": "OFFICIAL_PUBLIC_UNCONFIRMED"
    }
  ],
  "missing": ["photo d'équipe"]
}
```

Un média **sans provenance est refusé**. Voir
[ACE-ASSET-SOURCES.md](ACE-ASSET-SOURCES.md).

### RESEARCH

```json
{
  "facts": [
    { "key": "businessName", "value": "…", "source": "https://…", "confidence": "verified" }
  ],
  "notFound": ["horaires", "SIRET"]
}
```

**Un fait sans source est refusé** (exit 2). Ce qui est introuvable va dans
`notFound` et devient `[À CONFIRMER]` dans le site — jamais une invention.

### CONTENT

```json
{ "hero": {…}, "story": {…}, "collection": {…}, "conversion": {…} }
```

Rédigé **à partir des faits vérifiés uniquement**. Aucun avis, prix, promesse,
récompense ou chiffre inventé. Le contenu est écrit dans
`src/config/site-content.ts` du site généré, et les visuels fournis par le
client sont câblés dans le hero et la collection.

### VISUAL_QA

```json
{ "score": 0.82, "issues": ["…"], "screenshots": ["desktop.png", "mobile.png"] }
```

Il faut **réellement regarder** les captures. Sous le seuil
(`quality.minScore`), AUTOPILOT redemande une passe en rappelant les défauts à
corriger d'abord. Après `maxVisualIterations`, il bloque en
`QUALITY_NOT_REACHED` plutôt que de livrer un site moyen.

## Garde-fous

| Gate          | Bloque quand                                   | Résultat                   |
| ------------- | ---------------------------------------------- | -------------------------- |
| environnement | `ace:doctor` dit non                           | `ENVIRONMENT_NOT_READY`    |
| visuels       | parti-pris porté par l'image, aucun média réel | `MEDIA_ASSET_REQUIRED`     |
| droits        | production avec des droits non confirmés       | `MEDIA_RIGHTS_UNCONFIRMED` |
| faits         | l'entreprise n'est pas identifiée              | `MISSING_ESSENTIAL_INFO`   |
| qualité       | score insuffisant après N passes               | `QUALITY_NOT_REACHED`      |
| déploiement   | **toujours**                                   | rien n'est jamais publié   |

**ACE ne génère aucun média** : aucune API payante, aucun crédit, coût 0 €. S'il
manque un visuel indispensable, il le DEMANDE — jamais de 3D low-poly ni d'image
de substitution ([ACE-ANTI-LOW-POLY.md](ACE-ANTI-LOW-POLY.md),
[ACE-ASSET-SOURCES.md](ACE-ASSET-SOURCES.md)).

## Direction artistique autonome

L'utilisateur ne devient pas directeur artistique. `decideArtDirection()` choisit
preset, intensités et recipes à partir du **secteur** et des **mots de style**
de la demande, avec une justification écrite. Deux règles notables :

- une demande « sobre / rassurant » **abaisse** l'intensité, même dans un secteur
  spectaculaire ;
- si le client fournit de vraies photos, le hero passe en `media-first` : montrer
  sa matière vaut mieux qu'une page purement typographique.

Un test verrouille chaque recipe choisie contre le catalogue réel : ACE ne peut
pas proposer une recipe qui n'existe pas.

## Politique

Tout est centralisé dans `src/config/ace-autopilot-policy.ts` : comportement
quand aucun visuel n'existe, itérations visuelles, et les deux listes explicites
de ce qu'ACE peut faire seul / ne fera jamais sans demande (pousser, déployer,
acheter un domaine, inventer une information client). **Aucun seuil de dépense :
ACE ne dépense rien.**

## Template vs site client

AUTOPILOT appartient à **la template**. Le générateur l'élague : un site livré
contient le runtime dont il a besoin, pas le cerveau de production. Un test le
vérifie (voir [ACE-PUBLIC-RELEASE.md](ACE-PUBLIC-RELEASE.md)).

# Intégrations optionnelles

Ce document détaille l'activation des paquets **ADAPTER ONLY** et la configuration des **services pilotés par variables d'environnement** (env-gated).

Règles :

- Gestionnaire : **pnpm 10.32**. Jamais `--force` ni `--legacy-peer-deps`.
- Aucun secret n'est stocké dans le dépôt. Les clés vont dans les variables d'environnement (`.env.local` en dev, secrets de l'hébergeur en prod).
- Chaque intégration ADAPTER ONLY possède déjà son **composant adaptateur** et un **fallback**. Installer le paquet active le rendu complet.

---

## Paquets ADAPTER ONLY

### Theatre.js — caméra scroll avancée

- **Commande** : `pnpm add @theatre/core` puis, en dev seulement, `pnpm add -D @theatre/studio`.
- **Variable d'env** : aucune.
- **Adaptateur** : intégration caméra (par défaut native GSAP ScrollTrigger + R3F).
- **Asset requis** : aucun (fichier de projet Theatre optionnel).
- **Note** : **Studio ne doit jamais être chargé en production.**
- **Fallback** : séquence caméra native GSAP/ScrollTrigger.

### ShaderGradient — fond dégradé shader

- **Commande** : `pnpm add @shadergradient/react`.
- **Variable d'env** : aucune.
- **Adaptateur** : `ShaderGradientBackground`.
- **Asset requis** : aucun (paramétré par props).
- **Fallback** : dégradé CSS / canvas.

### GlassSurface — effet verre liquide

- **Commande** : `pnpm add liquid-glass-js` **ou** `pnpm add @paper-design/shaders-react`.
- **Variable d'env** : aucune.
- **Adaptateur** : `GlassSurface`.
- **Asset requis** : aucun.
- **Fallback** : `backdrop-filter` CSS en couches.

### Rive — animations vectorielles interactives

- **Commande** : `pnpm add @rive-app/react-canvas`.
- **Variable d'env** : aucune.
- **Adaptateur** : `RiveScene`.
- **Asset requis** : un fichier `.riv` (placé dans `public/` ou ingéré via `input/assets/`).
- **Fallback** : poster statique.

### Spline — scènes 3D Spline

- **Commande** : `pnpm add @splinetool/react-spline`.
- **Variable d'env** : aucune.
- **Adaptateur** : `SplineScene`.
- **Asset requis** : une scène Spline (URL exportée ou fichier).
- **Fallback** : poster statique.
- **Attention** : peut embarquer sa propre version de `three` (voir `docs/COMPATIBILITY.md`).

---

## Services env-gated

### Resend — envoi d'e-mails (formulaires)

- **Clé API requise** : **oui** (`RESEND_API_KEY`).
- **Config** : renseigner l'expéditeur/destinataire dans la config prévue.
- **Sans clé** : le formulaire valide côté client (Zod) mais l'envoi est désactivé / en mode no-op.

### Webhook CRM

- **Clé API requise** : dépend du CRM ; généralement une URL de webhook (`CRM_WEBHOOK_URL`) et éventuellement un secret.
- **Sans configuration** : les soumissions ne sont pas transmises au CRM (le reste du formulaire fonctionne).

### Cal.com — prise de rendez-vous

- **Clé API requise** : **non** pour l'intégration embed standard. Nécessite un **lien/handle Cal.com** (`NEXT_PUBLIC_CALCOM_LINK` ou équivalent).
- **Sans lien** : le bloc rendez-vous n'est pas affiché ou renvoie vers un CTA de contact.

### Analytics

- **Vercel Analytics** : **sans clé** lorsqu'hébergé sur Vercel (activation via le dashboard/env de la plateforme).
- **PostHog** : clé publique requise (`NEXT_PUBLIC_POSTHOG_KEY`) + host (`NEXT_PUBLIC_POSTHOG_HOST`).
- **Plausible** : **sans clé API** ; nécessite le **domaine** configuré (`NEXT_PUBLIC_PLAUSIBLE_DOMAIN`).
- **Google Analytics (GA4)** : identifiant de mesure requis (`NEXT_PUBLIC_GA_ID`).
- **Sans configuration** : aucun tracker n'est chargé (comportement par défaut, respectueux de la vie privée).

### MapLibre — style de carte personnalisé

- **Clé API requise** : **non** par défaut. MapLibre fonctionne **sans clé propriétaire** avec un style libre.
- **Style custom** : fournir une URL de style (`NEXT_PUBLIC_MAP_STYLE_URL`). Certains fournisseurs de tuiles peuvent exiger leur propre clé — dans ce cas, la renseigner via env, jamais en dur.
- **Sans configuration** : carte avec fond de carte libre par défaut.

---

## Récapitulatif « clé requise »

| Service          | Clé API              | Variable(s)                                           |
| ---------------- | -------------------- | ----------------------------------------------------- |
| Resend           | Oui                  | `RESEND_API_KEY`                                      |
| Webhook CRM      | Selon CRM            | `CRM_WEBHOOK_URL` (+ secret éventuel)                 |
| Cal.com          | Non (lien requis)    | `NEXT_PUBLIC_CALCOM_LINK`                             |
| Vercel Analytics | Non (sur Vercel)     | —                                                     |
| PostHog          | Oui                  | `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` |
| Plausible        | Non (domaine requis) | `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`                        |
| GA4              | Oui (ID mesure)      | `NEXT_PUBLIC_GA_ID`                                   |
| MapLibre         | Non par défaut       | `NEXT_PUBLIC_MAP_STYLE_URL` (optionnel)               |

> Les noms de variables ci-dessus sont indicatifs et à aligner avec la configuration réelle du projet. Aucun secret ne doit être commité.

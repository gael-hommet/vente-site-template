---
description: Formulaires (react-hook-form + zod) et CTA — accessibilité, endpoint simulé en dev, adaptateurs env-gated.
globs: src/components/conversion/**,src/lib/forms/**
---

# Conversion (formulaires & CTA)

## Formulaires

- **react-hook-form + zod** pour l'état et la validation. Schéma zod partagé client/serveur.
- Champs accessibles : labels associés, `aria-invalid`, messages d'erreur liés au champ, focus sur la première erreur.
- États **succès/erreur visibles** et explicites après soumission.
- Anticiper le spam : honeypot et/ou throttling léger, validation stricte. Pas de captcha tiers activé par défaut.

## Envoi (dev vs prod)

- En dev, endpoint **local simulé** : aucun envoi vers un service tiers.
- Les adaptateurs (Resend, CRM, Cal.com, analytics) sont **env-gated** : désactivés tant que les variables d'environnement requises ne sont pas présentes.
- Ne jamais coder en dur des clés/URL de service ; passer par la config env.

## CTA

- **CTA sticky mobile** persistant et non intrusif.
- **Click-to-call** (`tel:`) et **itinéraire/directions** (lien maps) à partir de `business.ts`.
- Le CTA est toujours atteignable, sans terminer une scène/animation, et sans scroll bloqué.

## Données

- Ne jamais inventer d'infos client (prix, promos, avis, notes, certifications). Consommer `business.ts`.

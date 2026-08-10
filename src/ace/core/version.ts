/**
 * ACE — Aurexia Cinematic Engine. Engine identity.
 *
 * Every generated client site records the engine version it was built from
 * (see the future `ace:new-site` generator), which is what makes template-diff
 * updates possible in the one-repo-per-client distribution model.
 */

export const ACE_NAME = "Aurexia Cinematic Engine";
export const ACE_SHORT_NAME = "ACE";

/** Semver of the engine layer itself (not the app). Bump on contract changes. */
export const ACE_VERSION = "0.2.2";

/** The engine modules and what each one owns. Displayed on /ace-lab. */
export const ACE_MODULES = {
  "ace-core": "Identité, contrats partagés, registres typés",
  "ace-config": "Design Language configurable (presets de tokens)",
  "ace-ui": "Primitives UI (façade des composants ui/)",
  "ace-motion": "Orchestration GSAP/Motion/Lenis + registre de motions nommés",
  "ace-scenes": "Scene Library WebGL : contrats, fallbacks obligatoires, tiers",
  "ace-media": "Contrats médias anti-CLS (posters, dimensions, alt)",
  "ace-autopilot":
    "Autopilot : mission en langage naturel, machine à états persistante, garde-fous, rapports",
  "ace-media-engine":
    "Creative Media Engine : décision de stratégie, sources d'assets et droits, QA réelle, gate premium, continuité — sans aucune génération payante",
  "ace-content": "Intégrité du contenu : faits vérifiés vs [À CONFIRMER]",
  "ace-seo": "Metadata + JSON-LD dérivés de business.ts",
  "ace-forms": "Schémas zod partagés + contrat d'adaptateur de livraison",
  "ace-analytics": "Événements typés, fournisseurs env-gated",
  "ace-testing": "Aides de test (reduced-motion, tiers, profils device)",
} as const;

export type AceModuleId = keyof typeof ACE_MODULES;

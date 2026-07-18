import type { ClientConfigInput } from "./client-schema";

/**
 * Configuration client NEUTRE minimale — point de départ d'un nouveau site et
 * fixture de test. Volontairement sans identité : aucun secteur, aucun fait
 * inventé. Un vrai client remplace `identity.name` et enrichit à partir d'un
 * brief vérifié.
 */
export const neutralClientConfig: ClientConfigInput = {
  identity: {
    name: "Nouveau site",
    locale: "fr-FR",
  },
  industry: "other",
  goals: { primaryConversion: "contact" },
  design: {
    preset: "neutral",
    motionIntensity: "subtle",
    webglIntensity: "none",
    density: "comfortable",
    darkMode: true,
  },
  features: {
    contactForm: true,
    stickyMobileCta: true,
  },
};

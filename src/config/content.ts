import { toConfirm, type ContentValue } from "@/ace/content";

/**
 * Starter site content — the editorial layer the generator (`ace:new-site`)
 * and `/build-site` fill from a verified client brief.
 *
 * Structure vs facts:
 * - Structural copy (section headings, generic promises) is neutral starter
 *   text — it demonstrates the layout and MUST be rewritten per client.
 * - FACTS (numbers, prices, addresses, years, credentials) are `ContentValue`s
 *   and start as `toConfirm(...)`: they render with a visible [À CONFIRMER]
 *   mark and can never silently pass as verified claims.
 */

export interface StarterOffer {
  title: string;
  description: string;
  /** Verified public price only. */
  price: ContentValue<string>;
}

export interface StarterFaqEntry {
  question: string;
  answer: ContentValue<string>;
}

export const starterContent = {
  hero: {
    kicker: "Starter ACE — direction artistique à définir",
    title: "Votre promesse, mise en scène",
    subtitle:
      "Ce starter démontre la structure d'un site premium : narration, preuve, offre et conversion. Chaque texte, image et couleur est remplacé par la direction artistique du client.",
    primaryCta: { label: "Demander un devis", href: "/contact" },
    secondaryCta: { label: "Découvrir l'offre", href: "/offre" },
  },

  proof: {
    /** Facts: every figure must come from the brief. */
    items: [
      { value: toConfirm<string>(undefined, "années d'expérience"), label: "années d'expérience" },
      { value: toConfirm<string>(undefined, "projets livrés"), label: "projets réalisés" },
      { value: toConfirm<string>(undefined, "note moyenne sourcée"), label: "note clients" },
      { value: toConfirm<string>(undefined, "zone desservie"), label: "zone d'intervention" },
    ] satisfies { value: ContentValue<string>; label: string }[],
  },

  offers: [
    {
      title: "Offre essentielle",
      description:
        "Première formule du client : périmètre, livrables et bénéfices concrets, décrits dans ses mots.",
      price: toConfirm<string>(undefined, "prix public vérifié"),
    },
    {
      title: "Offre signature",
      description:
        "La formule phare : ce qui distingue réellement ce client de ses concurrents locaux.",
      price: toConfirm<string>(undefined, "prix public vérifié"),
    },
    {
      title: "Offre sur mesure",
      description: "Projets spécifiques : audit, conseil, accompagnement ou réalisation dédiée.",
      price: toConfirm<string>(undefined, "sur devis"),
    },
  ] satisfies StarterOffer[],

  about: {
    title: "Une histoire à raconter",
    paragraphs: [
      "Cette page accueille l'histoire vraie du client : origine, savoir-faire, équipe, valeurs. Aucun élément biographique n'est inventé par le moteur.",
      "La direction artistique (photos, matières, typographies) est définie lors de la phase de conception, jamais héritée du starter.",
    ],
    /** Facts about the business — filled from the brief. */
    founded: toConfirm<string>(undefined, "année de création"),
    team: toConfirm<string>(undefined, "taille de l'équipe"),
  },

  faq: [
    {
      question: "Quels sont vos délais habituels ?",
      answer: toConfirm<string>(undefined, "réponse du client"),
    },
    {
      question: "Quelle zone couvrez-vous ?",
      answer: toConfirm<string>(undefined, "réponse du client"),
    },
    {
      question: "Comment se déroule un premier rendez-vous ?",
      answer: toConfirm<string>(undefined, "réponse du client"),
    },
  ] satisfies StarterFaqEntry[],

  legal: {
    /** Every legal mention is a fact — nothing is prefilled. */
    entity: toConfirm<string>(undefined, "raison sociale"),
    siret: toConfirm<string>(undefined, "SIRET"),
    address: toConfirm<string>(undefined, "adresse du siège"),
    publisher: toConfirm<string>(undefined, "responsable de publication"),
    host: toConfirm<string>(undefined, "hébergeur et coordonnées"),
  },
} as const;

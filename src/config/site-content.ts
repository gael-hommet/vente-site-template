import type { SiteContent } from "./site-content.types";

/**
 * Modèle de CONTENU éditorial du site — la couche que le générateur
 * (`ace:new-site`) remplit depuis `validation-inputs/<fixture>/content/` (ou
 * `input/content/` pour un vrai client). Il alimente la home config-driven
 * (`ConfiguredHome`) qui rend les recipes sélectionnées.
 *
 * Séparation stricte :
 * - la STRUCTURE (quelle recipe, dans quel ordre) vient de `client.resolved.ts`
 *   (recipes.*) ;
 * - le CONTENU (titres, chapitres, items) vient d'ICI ;
 * - les FAITS vérifiables (téléphone, adresse, prix) restent dans
 *   `business.ts` — jamais inventés.
 *
 * Le défaut ci-dessous est NEUTRE : il fait tourner le moteur et ses tests
 * sans identité client. Un site généré le remplace intégralement.
 */
export const siteContent: SiteContent = {
  hero: {
    eyebrow: "Starter ACE",
    title: "Votre promesse, mise en scène",
    subtitle:
      "Ce starter démontre la structure d'un site premium. Chaque texte, image et couleur est remplacé par la direction artistique du client.",
    primaryCta: { label: "Nous contacter", href: "/contact" },
    secondaryCta: { label: "Découvrir", href: "#story" },
    media: null,
  },
  story: {
    heading: "Notre approche",
    intro: "Trois temps neutres — remplacés par le récit vérifié du client.",
    chapters: [
      {
        eyebrow: "01",
        title: "Écoute",
        body: "Comprendre le besoin réel avant toute proposition.",
      },
      { eyebrow: "02", title: "Conception", body: "Une direction sur mesure, jamais générique." },
      {
        eyebrow: "03",
        title: "Réalisation",
        body: "Une exécution soignée, mesurable et durable.",
      },
    ],
  },
  collection: {
    heading: "Réalisations",
    intro: "Exemples neutres — remplacés par le portfolio vérifié du client.",
    itemLabel: "élément",
    items: [
      { title: "Élément A", href: "/realisations", meta: ["Catégorie", "2024"], media: null },
      { title: "Élément B", href: "/realisations", meta: ["Catégorie", "2024"], media: null },
      { title: "Élément C", href: "/realisations", meta: ["Catégorie", "2023"], media: null },
    ],
  },
  conversion: {
    title: "Prêt à en parler ?",
    description:
      "Le point de conversion reste atteignable depuis chaque section, sans terminer une scène ni une animation.",
    primaryCta: { label: "Nous contacter", href: "/contact" },
  },
  nav: [
    { label: "Accueil", href: "/" },
    { label: "Réalisations", href: "/realisations" },
    { label: "À propos", href: "/a-propos" },
    { label: "Contact", href: "/contact" },
  ],
};

export type { SiteContent } from "./site-content.types";

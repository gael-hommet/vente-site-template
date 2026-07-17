export interface NavItem {
  label: string;
  href: string;
}

/** Primary navigation — the starter's standard premium-site routes. A client
 * site renames/reorders these to match its real sections. */
export const primaryNav: NavItem[] = [
  { label: "Accueil", href: "/" },
  { label: "Offre", href: "/offre" },
  { label: "Réalisations", href: "/realisations" },
  { label: "À propos", href: "/a-propos" },
  { label: "Contact", href: "/contact" },
];

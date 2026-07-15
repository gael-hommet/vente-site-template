export interface NavItem {
  label: string;
  href: string;
}

/** Primary navigation. A client site replaces these with its real sections. */
export const primaryNav: NavItem[] = [
  { label: "Accueil", href: "/" },
  { label: "Laboratoire", href: "/lab" },
];

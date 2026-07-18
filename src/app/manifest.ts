import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

/** Web app manifest. Icons are added per client under /public. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    // Défaut neutre clair (le thème par défaut est clair) ; un site client
    // l'aligne sur sa palette. Jamais un noir froid par défaut.
    background_color: "#fafafa",
    theme_color: "#fafafa",
    icons: [],
  };
}

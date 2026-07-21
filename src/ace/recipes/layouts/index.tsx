import type { LayoutProps } from "../types";
import { cn } from "@/lib/utils";

/**
 * Recipes de LAYOUT : enveloppe header / main / footer. Elles diffèrent par le
 * traitement du conteneur principal (pleine largeur vs colonne, rythme
 * vertical). Le contenu (recipes de page) est passé en `children`.
 */

function Shell({
  header,
  children,
  footer,
  className,
  mainClass,
}: LayoutProps & { mainClass: string }) {
  return (
    <div className={cn("flex min-h-full flex-col", className)}>
      {header}
      <main id="main" className={cn("flex-1", mainClass)}>
        {children}
      </main>
      {footer}
    </div>
  );
}

/**
 * Traitement du conteneur principal par layout — source unique. Consommé par
 * les recipes de layout ci-dessous ET par la home config-driven
 * (`layoutMainClass`), pour que la sélection `recipes.layout` soit RÉELLEMENT
 * observable dans le DOM d'un site généré (max-width, padding, rythme des
 * sections diffèrent).
 */
export const LAYOUT_MAIN_CLASS: Record<string, string> = {
  "editorial-layout": "mx-auto w-full max-w-6xl px-6",
  "immersive-layout": "w-full",
  "product-layout": "mx-auto w-full max-w-5xl px-6 [&>section]:py-12",
  "institutional-layout": "mx-auto w-full max-w-4xl px-6 [&>section]:py-16",
};

/** Classe de conteneur pour un id de layout (défaut éditorial si inconnu). */
export function layoutMainClass(id: string): string {
  return LAYOUT_MAIN_CLASS[id] ?? LAYOUT_MAIN_CLASS["editorial-layout"];
}

/** Éditorial : colonne large, marges généreuses, rythme aéré. */
export function EditorialLayout(props: LayoutProps) {
  return <Shell {...props} mainClass={LAYOUT_MAIN_CLASS["editorial-layout"]} />;
}

/** Immersif : pleine largeur, sections bord à bord (le contenu gère ses marges). */
export function ImmersiveLayout(props: LayoutProps) {
  return <Shell {...props} mainClass={LAYOUT_MAIN_CLASS["immersive-layout"]} />;
}

/** Produit : colonne resserrée et structurée, densité soutenue. */
export function ProductLayout(props: LayoutProps) {
  return <Shell {...props} mainClass={LAYOUT_MAIN_CLASS["product-layout"]} />;
}

/** Institutionnel : centré, largeur modérée, ton formel. */
export function InstitutionalLayout(props: LayoutProps) {
  return <Shell {...props} mainClass={LAYOUT_MAIN_CLASS["institutional-layout"]} />;
}

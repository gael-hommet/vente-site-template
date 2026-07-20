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

/** Éditorial : colonne large, marges généreuses, rythme aéré. */
export function EditorialLayout(props: LayoutProps) {
  return <Shell {...props} mainClass="mx-auto w-full max-w-6xl px-6" />;
}

/** Immersif : pleine largeur, sections bord à bord (le contenu gère ses marges). */
export function ImmersiveLayout(props: LayoutProps) {
  return <Shell {...props} mainClass="w-full" />;
}

/** Produit : colonne resserrée et structurée, densité soutenue. */
export function ProductLayout(props: LayoutProps) {
  return <Shell {...props} mainClass="mx-auto w-full max-w-5xl px-6 [&>section]:py-12" />;
}

/** Institutionnel : centré, largeur modérée, ton formel. */
export function InstitutionalLayout(props: LayoutProps) {
  return <Shell {...props} mainClass="mx-auto w-full max-w-4xl px-6 [&>section]:py-16" />;
}

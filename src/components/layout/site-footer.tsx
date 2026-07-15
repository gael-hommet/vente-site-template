import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";

/** Minimal template shell footer. Client sites use ConversionFooter instead. */
export function SiteFooter() {
  return (
    <footer className="border-border text-muted mt-auto border-t py-10 text-sm">
      <Container>
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <p>{siteConfig.name} — moteur de sites commerciaux premium.</p>
          <p className="text-xs">
            Template technique. Aucun contenu ci-dessus ne représente un vrai client.
          </p>
        </div>
      </Container>
    </footer>
  );
}

import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Navigation } from "./navigation";
import { ThemeToggle } from "./theme";
import { siteConfig } from "@/config/site";
import { resolvedFeatures } from "@/config/features.generated";

/** Sticky, glassy site header shell used by the template pages. */
export function SiteHeader() {
  return (
    <header className="border-border/60 sticky top-0 z-40 border-b">
      <div className="glass">
        <Container>
          <div className="flex h-16 items-center justify-between gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-[var(--radius-sm)] font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-[var(--ring)]"
            >
              <span
                className="bg-brand inline-block size-2.5 rounded-full shadow-[var(--shadow-glow)]"
                aria-hidden
              />
              {siteConfig.name}
            </Link>
            <div className="flex items-center gap-1">
              <Navigation />
              {/* darkMode=false : aucun contrôle de thème inutile (features résolues à la génération). */}
              {resolvedFeatures.darkMode && <ThemeToggle />}
            </div>
          </div>
        </Container>
      </div>
    </header>
  );
}

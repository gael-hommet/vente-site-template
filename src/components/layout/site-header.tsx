import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Navigation } from "./navigation";
import { ThemeToggle } from "./theme";
import { siteConfig } from "@/config/site";

/** Sticky, glassy site header shell used by the template pages. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60">
      <div className="glass">
        <Container>
          <div className="flex h-16 items-center justify-between gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-[var(--radius-sm)] font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-[var(--ring)]"
            >
              <span className="inline-block size-2.5 rounded-full bg-brand shadow-[var(--shadow-glow)]" aria-hidden />
              {siteConfig.name}
            </Link>
            <div className="flex items-center gap-1">
              <Navigation />
              <ThemeToggle />
            </div>
          </div>
        </Container>
      </div>
    </header>
  );
}

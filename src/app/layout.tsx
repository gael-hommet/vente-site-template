import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { baseMetadata } from "@/lib/seo/metadata";
import { SkipLink } from "@/components/layout/skip-link";
import { ThemeProvider, ThemeScript } from "@/components/layout/theme";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { DeviceQualityProvider } from "@/components/three/DeviceQualityProvider";
import { SmoothScrollProvider } from "@/components/motion/SmoothScrollProvider";
import { Analytics } from "@/components/analytics/Analytics";
import { JsonLd } from "@/components/seo/JsonLd";
import { websiteJsonLd } from "@/lib/seo/jsonld";
import { DesignLanguageStyle } from "@/ace/config/DesignLanguageStyle";
import { StickyMobileCTA } from "@/components/conversion/ctas";
import { siteConfig } from "@/config/site";
import { businessConfig } from "@/config/business";
import { resolvedFeatures } from "@/config/features.generated";

const sans = Geist({ variable: "--font-sans", subsets: ["latin"], display: "swap" });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"], display: "swap" });
const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = baseMetadata;

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${sans.variable} ${mono.variable} ${display.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      {/* pb mobile : réserve la hauteur de la StickyMobileCTA fixe (+ safe-area
          iOS) pour qu'elle ne recouvre jamais le bas du footer — seulement si
          elle est effectivement montée (features.stickyMobileCta). */}
      <body
        className={
          resolvedFeatures.stickyMobileCta
            ? "flex min-h-full flex-col pb-[calc(env(safe-area-inset-bottom)+5.5rem)] md:pb-0"
            : "flex min-h-full flex-col"
        }
      >
        <ThemeScript />
        <DesignLanguageStyle preset={siteConfig.acePreset} />
        <JsonLd data={websiteJsonLd()} />
        <SkipLink targetId="main" />
        <ThemeProvider>
          <DeviceQualityProvider>
            <SmoothScrollProvider>
              <SiteHeader />
              <main id="main" className="flex-1">
                {children}
              </main>
              <SiteFooter />
              {resolvedFeatures.stickyMobileCta && businessConfig.telephone && (
                <StickyMobileCTA
                  phone={businessConfig.telephone}
                  primaryLabel="Demander un devis"
                  primaryHref="/contact"
                />
              )}
            </SmoothScrollProvider>
          </DeviceQualityProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}

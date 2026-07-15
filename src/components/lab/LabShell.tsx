"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { LabSection } from "./LabSection";
import { QualitySelector } from "./QualitySelector";
import { EngineStatus } from "@/components/EngineStatus";

// UI + light components (safe to render inline).
import { Button } from "@/components/ui/button";
import { GlassButton } from "@/components/ui/glass-button";
import { Card, GlassCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { LoadingState } from "@/components/ui/states";

import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { SplitTextFallback } from "@/components/motion/SplitTextFallback";
import { ScrollScene } from "@/components/motion/ScrollScene";
import { useSmoothScroll } from "@/components/motion/SmoothScrollProvider";

import { GlassSurface } from "@/components/effects/GlassSurface";
import { ShaderGradientBackground } from "@/components/effects/ShaderGradientBackground";
import { LiquidMetalLogo } from "@/components/effects/LiquidMetalLogo";

import { LayeredPhoto } from "@/components/photo/LayeredPhoto";
import { BeforeAfter } from "@/components/photo/BeforeAfter";
import { KenBurnsScene } from "@/components/photo/KenBurnsScene";
import { InteriorGallery } from "@/components/photo/InteriorGallery";
import { PanoramaAdapter } from "@/components/photo/PanoramaAdapter";

import { MediaFallback } from "@/components/media/MediaFallback";
import { LeadForm } from "@/components/conversion/LeadForm";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// Heavy (WebGL / MapLibre / canvas-gen) demos — dynamically imported, no SSR.
// Next requires the options argument to be an inline object literal.
const LogoCanvas = dynamic(() => import("./canvases").then((m) => m.LogoCanvas), {
  ssr: false,
  loading: () => <LoadingState />,
});
const ProductCanvas = dynamic(() => import("./canvases").then((m) => m.ProductCanvas), {
  ssr: false,
  loading: () => <LoadingState />,
});
const JourneyDemo = dynamic(() => import("./JourneyDemo").then((m) => m.JourneyDemo), {
  ssr: false,
  loading: () => <LoadingState />,
});
const MapDemo = dynamic(() => import("./MapDemo").then((m) => m.MapDemo), {
  ssr: false,
  loading: () => <LoadingState />,
});
const SceneToMapDemo = dynamic(() => import("./SceneToMapDemo").then((m) => m.SceneToMapDemo), {
  ssr: false,
  loading: () => <LoadingState />,
});
const ImageSequenceDemo = dynamic(
  () => import("./ImageSequenceDemo").then((m) => m.ImageSequenceDemo),
  {
    ssr: false,
    loading: () => <LoadingState />,
  },
);

function LenisDemo() {
  const { scrollTo } = useSmoothScroll();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="outline" onClick={() => scrollTo("#lab-top")}>
        Remonter en douceur (Lenis)
      </Button>
      <p className="text-muted text-sm">
        Lenis est actif globalement et synchronisé à ScrollTrigger ; désactivé sous reduced-motion.
      </p>
    </div>
  );
}

export function LabShell() {
  const reduced = useReducedMotion();

  return (
    <div id="lab-top" className="mx-auto w-full max-w-6xl px-5 sm:px-6 lg:px-8">
      {/* Sticky quality selector */}
      <div className="border-border bg-background/80 sticky top-16 z-30 -mx-5 mb-6 border-b px-5 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <QualitySelector />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-5xl">
            Laboratoire
          </h1>
          <p className="text-muted mt-3 max-w-xl">
            Démonstrations techniques des briques du moteur — sans marque ni asset protégé. Utilisez
            le sélecteur ULTRA / BALANCED / LITE pour prévisualiser chaque parcours d&apos;appareil.
          </p>
        </div>
        <EngineStatus />
      </div>

      <LabSection
        index={1}
        title="Design system"
        description="Boutons, cartes, badges, dialog accessible."
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Brand</Button>
            <Button variant="solid">Solid</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <GlassButton>Glass</GlassButton>
            <Badge variant="brand">Badge</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="p-6">
              <p className="font-semibold">Card</p>
              <p className="text-muted text-sm">Surface opaque standard.</p>
            </Card>
            <GlassCard className="p-6">
              <p className="font-semibold">GlassCard</p>
              <p className="text-muted text-sm">Verre progressif (fallback opaque).</p>
            </GlassCard>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="subtle">Ouvrir un dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle className="text-lg font-semibold">Dialog accessible</DialogTitle>
              <DialogDescription className="text-muted mt-2 text-sm">
                Focus trap, ESC, scroll lock via Radix. Testé au clavier.
              </DialogDescription>
            </DialogContent>
          </Dialog>
        </div>
      </LabSection>

      <LabSection
        index={2}
        title="Motion — micro-interactions"
        description="Reveal, magnétisme, split text (fallback sans dépendance premium)."
      >
        <div className="flex flex-col gap-8">
          <RevealGroup className="grid gap-3 sm:grid-cols-3">
            <Card className="p-6">Reveal 1</Card>
            <Card className="p-6">Reveal 2</Card>
            <Card className="p-6">Reveal 3</Card>
          </RevealGroup>
          <MagneticButton className="w-fit">
            <Button variant="brand">Bouton magnétique</Button>
          </MagneticButton>
          <SplitTextFallback
            text="Texte révélé mot par mot"
            className="text-2xl font-semibold sm:text-4xl"
          />
        </div>
      </LabSection>

      <LabSection
        index={3}
        title="Timeline GSAP / ScrollTrigger"
        description="Chorégraphie d'entrée scrubbée au scroll (non épinglée)."
      >
        <ScrollScene
          className="grid grid-cols-4 gap-3"
          build={({ root, gsap }) => {
            const items = root.querySelectorAll("[data-box]");
            const tl = gsap.timeline();
            tl.from(items, { y: 60, opacity: 0, stagger: 0.1, ease: "power3.out" });
            return tl;
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              data-box
              className="bg-surface-2 text-muted grid aspect-square place-items-center rounded-[var(--radius-md)]"
            >
              {i + 1}
            </div>
          ))}
        </ScrollScene>
      </LabSection>

      <LabSection
        index={4}
        title="Lenis — smooth scroll"
        description="Défilement fluide synchronisé, respectant reduced-motion."
      >
        <LenisDemo />
      </LabSection>

      <LabSection
        index={5}
        title="React Three Fiber — primitives"
        description="Produit primitif orbitrable avec hotspots accessibles."
      >
        <ProductCanvas />
      </LabSection>

      <LabSection
        index={6}
        title="Caméra pilotée par le scroll"
        description="Le visiteur contrôle le film avec son scroll (GSAP pin + R3F)."
      >
        <JourneyDemo />
      </LabSection>

      <LabSection
        index={7}
        title="Postprocessing (ULTRA)"
        description="Bloom + vignette raisonnables, actifs uniquement en ULTRA."
      >
        <LogoCanvas />
      </LabSection>

      <LabSection
        index={8}
        title="ShaderGradient (fallback CSS)"
        description="Fond mesh animé, sans dépendance ni three.js embarqué."
      >
        <div className="border-border relative h-64 overflow-hidden rounded-[var(--radius-lg)] border">
          <ShaderGradientBackground />
          <div className="relative grid h-full place-items-center">
            <span className="text-lg font-medium">Arrière-plan animé</span>
          </div>
        </div>
      </LabSection>

      <LabSection
        index={9}
        title="Liquid metal (CSS)"
        description="Wordmark métallique animé, statique sous reduced-motion."
      >
        <LiquidMetalLogo text="LIQUID METAL" className="text-4xl sm:text-6xl" />
      </LabSection>

      <LabSection
        index={10}
        title="Liquid glass avec fallback"
        description="GlassSurface : verre enrichi → backdrop-filter → opaque."
      >
        <div className="relative overflow-hidden rounded-[var(--radius-lg)] p-8">
          <ShaderGradientBackground />
          <GlassSurface className="p-6">
            <p className="font-semibold">GlassSurface</p>
            <p className="text-muted text-sm">
              Aucun composant essentiel ne dépend d&apos;une réfraction WebGL.
            </p>
          </GlassSurface>
        </div>
      </LabSection>

      <LabSection
        index={11}
        title="Séquence d'images (générée localement)"
        description="Frames dessinées côté client, scrubbées par un slider."
      >
        <ImageSequenceDemo />
      </LabSection>

      <LabSection
        index={12}
        title="Vidéo scrubbée"
        description="Activée en déposant une petite vidéo locale (voir ASSET-PIPELINE). Ici : poster de repli."
      >
        <div className="border-border aspect-video w-full overflow-hidden rounded-[var(--radius-lg)] border">
          <MediaFallback
            poster="/assets/poster.svg"
            alt="Aucune vidéo locale — poster de repli affiché"
          />
        </div>
      </LabSection>

      <LabSection
        index={13}
        title="Parallaxe 2.5D"
        description="Photo en couches réagissant au pointeur (statique sous reduced-motion)."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <LayeredPhoto
            alt="Scène 2.5D de démonstration"
            className="aspect-[16/10] rounded-[var(--radius-lg)]"
            layers={[
              { src: "/assets/layer-bg.svg", depth: -0.4, priority: true },
              { src: "/assets/demo-3.svg", depth: 0.3 },
            ]}
          />
          <KenBurnsScene
            src="/assets/demo-5.svg"
            alt="Photo animée (Ken Burns)"
            className="aspect-[16/10] rounded-[var(--radius-lg)]"
          />
        </div>
      </LabSection>

      <LabSection
        index={14}
        title="Transition vers MapLibre"
        description="Carte keyless + transition scène → carte. Position fictive."
      >
        <div className="flex flex-col gap-6">
          <MapDemo />
          <SceneToMapDemo />
        </div>
      </LabSection>

      <LabSection
        index={15}
        title="Formulaire local"
        description="react-hook-form + zod, endpoint simulé, anti-spam, états succès/erreur."
      >
        <div className="max-w-lg">
          <LeadForm />
        </div>
      </LabSection>

      <LabSection index={16} title="Photos : avant/après, galerie, panorama, Ken Burns">
        <div className="flex flex-col gap-6">
          <BeforeAfter
            beforeSrc="/assets/before.svg"
            afterSrc="/assets/after.svg"
            beforeAlt="Avant"
            afterAlt="Après"
          />
          <InteriorGallery
            images={[1, 2, 3, 4, 5, 6].map((n) => ({
              src: `/assets/demo-${n}.svg`,
              alt: `Photo ${n}`,
            }))}
          />
          <PanoramaAdapter
            src="/assets/pano.svg"
            alt="Panorama de démonstration"
            className="h-64"
          />
        </div>
      </LabSection>

      <LabSection
        index={17}
        title="Reduced motion & tiers"
        description="Le moteur respecte prefers-reduced-motion et adapte le rendu."
      >
        <Reveal>
          <p className="text-muted text-sm">
            Reduced motion :{" "}
            <span className="text-foreground font-medium">{reduced ? "ACTIF" : "inactif"}</span>.
            {reduced
              ? " Les animations non essentielles sont supprimées, le contenu reste accessible."
              : " Activez-le dans les préférences système pour voir le comportement dégradé."}
          </p>
        </Reveal>
      </LabSection>
    </div>
  );
}

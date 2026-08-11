import { Suspense } from "react";
import type { Metadata } from "next";
import { SpatialCinemaLab } from "@/components/ace-lab/SpatialCinemaLab";

/**
 * Laboratoire du Spatial Cinema Engine (route interne, jamais expédiée).
 * Sert de preuve vivante : un vrai voyage spatial, pas un diaporama.
 */
export const metadata: Metadata = {
  title: "Spatial Cinema — ACE Lab",
  robots: { index: false, follow: false },
};

export default function SpatialLabPage() {
  // `useSearchParams` impose une frontière de suspense côté serveur.
  return (
    <Suspense fallback={null}>
      <SpatialCinemaLab />
    </Suspense>
  );
}

"use client";

import dynamic from "next/dynamic";

/**
 * Bande de scène WebGL, chargée PARESSEUSEMENT via next/dynamic (ssr:false).
 *
 * Point critique de perf : HeroScene → AdaptiveCanvas → ThreeCanvas importe
 * three.js/R3F. Un import STATIQUE de HeroScene tirerait three dans le bundle
 * de la home de TOUT site — y compris un site éditorial sans WebGL. En passant
 * par next/dynamic, three devient un chunk asynchrone qui n'est téléchargé que
 * si cette bande est réellement montée (site immersif, tier compatible). Un
 * site éditorial (features.webgl=false) ne rend jamais <SceneBand>, donc le
 * chunk WebGL n'est jamais chargé.
 */
const HeroScene = dynamic(() => import("@/components/starter/HeroScene").then((m) => m.HeroScene), {
  ssr: false,
  loading: () => null,
});

export function SceneBand({ sceneId }: { sceneId: string }) {
  return <HeroScene sceneId={sceneId} />;
}

// Motion (micro-interactions) + GSAP (cinematic) wrappers. Keep the separation:
// Motion = enter/exit, hover, press, layout, parallax micro-effects.
// GSAP    = scrubbed/pinned cinematic sequences.
export { SmoothScrollProvider, useSmoothScroll } from "./SmoothScrollProvider";
export { Reveal, RevealGroup, type RevealProps } from "./Reveal";
export { ParallaxLayer, type ParallaxLayerProps } from "./ParallaxLayer";
export { MagneticButton, type MagneticButtonProps } from "./MagneticButton";
export { SplitTextFallback, type SplitTextProps } from "./SplitTextFallback";
export { ScrollProgress } from "./ScrollProgress";
export { PinnedSequence, type PinnedSequenceProps } from "./PinnedSequence";
export { ScrollScene, type ScrollSceneProps } from "./ScrollScene";
export {
  ChapterTimeline,
  chapterIndexFromProgress,
  type Chapter,
} from "./ChapterTimeline";

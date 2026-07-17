/**
 * ace-media — controlled-media components + contracts. Components come from
 * the existing library; the schemas make posters, alt text and explicit
 * dimensions non-optional wherever the engine handles media.
 */

export {
  ScrollVideo,
  ScrollImageSequence,
  ImageSequencePlayer,
  MediaFallback,
} from "@/components/media";

export {
  imageAssetSchema,
  videoAssetSchema,
  imageSequenceSchema,
  validateVideoAsset,
  type ImageAsset,
  type VideoAsset,
  type ImageSequenceAsset,
} from "./contracts";

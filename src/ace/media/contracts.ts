import { z } from "zod";

/**
 * Media contracts — the anti-CLS / accessibility rules as runtime-checkable
 * schemas. The generator and the asset pipeline validate every media reference
 * against these before it reaches a page.
 */

export const imageAssetSchema = z.object({
  src: z.string().min(1),
  /** Informative images need a real alt; decorative ones an explicit "". */
  alt: z.string(),
  /** Explicit dimensions are mandatory (CLS). */
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  /** `sizes` is required as soon as the image is responsive. */
  sizes: z.string().optional(),
});

export const videoAssetSchema = z.object({
  src: z.string().min(1),
  /** Posters are mandatory for every deferred/scrubbed video. */
  poster: z.string().min(1),
  alt: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  /** Spoken-voice videos must declare captions (house rule). */
  captions: z.string().optional(),
  hasSpeech: z.boolean().default(false),
});

export const imageSequenceSchema = z.object({
  /** Frame URL pattern, e.g. "/sequences/hero/{frame}.webp". */
  pattern: z.string().includes("{frame}"),
  frameCount: z.number().int().min(2),
  poster: z.string().min(1),
  alt: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export type ImageAsset = z.infer<typeof imageAssetSchema>;
export type VideoAsset = z.infer<typeof videoAssetSchema>;
export type ImageSequenceAsset = z.infer<typeof imageSequenceSchema>;

/** A spoken video without captions is a contract violation. */
export function validateVideoAsset(input: unknown): VideoAsset {
  const video = videoAssetSchema.parse(input);
  if (video.hasSpeech && !video.captions) {
    throw new Error(`[ace:media] video "${video.src}" has speech but no captions track`);
  }
  return video;
}

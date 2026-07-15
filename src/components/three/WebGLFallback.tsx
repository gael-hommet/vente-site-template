import Image from "next/image";
import { cn } from "@/lib/utils";

export interface WebGLFallbackProps {
  /** Poster image shown when WebGL is unavailable or a scene errors. */
  poster?: string;
  /** Optional looping video fallback (muted, playsInline). */
  video?: string;
  alt: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Non-WebGL visual fallback. This is what keeps every 3D experience accessible
 * on devices without WebGL, under reduced-motion/save-data, or when a scene
 * throws. Content is NEVER gated behind WebGL.
 */
export function WebGLFallback({ poster, video, alt, className, children }: WebGLFallbackProps) {
  return (
    <div
      className={cn(
        "bg-surface-2 relative flex h-full w-full items-center justify-center overflow-hidden rounded-[var(--radius-lg)]",
        className,
      )}
    >
      {video ? (
        <video
          className="h-full w-full object-cover"
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          aria-label={alt}
        >
          <source src={video} />
        </video>
      ) : poster ? (
        <Image
          src={poster}
          alt={alt}
          fill
          sizes="100vw"
          className="object-cover"
          priority={false}
        />
      ) : (
        <div
          className="text-muted grid place-items-center p-8 text-center text-sm"
          role="img"
          aria-label={alt}
        >
          {children ?? alt}
        </div>
      )}
    </div>
  );
}

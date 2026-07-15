import Image from "next/image";
import { cn } from "@/lib/utils";

export interface MediaFallbackProps {
  poster: string;
  alt: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Static poster fallback shared by all controlled-video modes. Shown on LITE
 * tier, reduced-motion/save-data, or when a sequence/video can't load. Always
 * accessible and never blocks content.
 */
export function MediaFallback({ poster, alt, className, children }: MediaFallbackProps) {
  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      <Image src={poster} alt={alt} fill sizes="100vw" className="object-cover" />
      {children && <div className="absolute inset-0">{children}</div>}
    </div>
  );
}

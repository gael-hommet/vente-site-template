"use client";

import * as React from "react";
import Image from "next/image";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface GalleryImage {
  src: string;
  alt: string;
}

/**
 * Responsive interior/product gallery with an accessible lightbox (Radix
 * Dialog: focus trap, ESC, scroll lock). Thumbnails are keyboard-operable.
 */
export function InteriorGallery({
  images,
  className,
}: {
  images: GalleryImage[];
  className?: string;
}) {
  return (
    <ul className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3", className)}>
      {images.map((img, i) => (
        <li key={i} className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-md)]">
          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                className="group block h-full w-full focus-visible:outline-2 focus-visible:outline-[var(--ring)]"
                aria-label={`Agrandir : ${img.alt}`}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(max-width: 640px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
                />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogTitle className="sr-only">{img.alt}</DialogTitle>
              <div className="relative aspect-video w-full">
                <Image src={img.src} alt={img.alt} fill sizes="90vw" className="object-contain" />
              </div>
            </DialogContent>
          </Dialog>
        </li>
      ))}
    </ul>
  );
}

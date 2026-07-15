import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FAQItem {
  question: string;
  answer: string;
}

/**
 * Accessible FAQ using native <details>/<summary> (keyboard + screen-reader
 * friendly, works without JS). Pair with faqJsonLd() from src/lib/seo for the
 * matching FAQPage structured data.
 */
export function FAQ({ items, className }: { items: FAQItem[]; className?: string }) {
  return (
    <div
      className={cn(
        "divide-border border-border divide-y rounded-[var(--radius-lg)] border",
        className,
      )}
    >
      {items.map((item, i) => (
        <details key={i} className="group px-5">
          <summary className="text-foreground flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium focus-visible:outline-2 focus-visible:outline-[var(--ring)]">
            {item.question}
            <ChevronDown
              className="text-muted size-5 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
              aria-hidden
            />
          </summary>
          <p className="text-muted pb-5 text-sm leading-relaxed">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}

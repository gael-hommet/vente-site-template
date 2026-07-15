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
    <div className={cn("divide-y divide-border rounded-[var(--radius-lg)] border border-border", className)}>
      {items.map((item, i) => (
        <details key={i} className="group px-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium text-foreground focus-visible:outline-2 focus-visible:outline-[var(--ring)]">
            {item.question}
            <ChevronDown className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden />
          </summary>
          <p className="pb-5 text-sm leading-relaxed text-muted">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}

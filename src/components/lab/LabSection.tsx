import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** A titled demo block for the laboratory. */
export function LabSection({
  index,
  title,
  description,
  children,
  className,
  id,
}: {
  index: number;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("scroll-mt-20 border-t border-border py-14", className)}>
      <div className="mb-6 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Badge variant="neutral">{String(index).padStart(2, "0")}</Badge>
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
        </div>
        {description && <p className="max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {children}
    </section>
  );
}

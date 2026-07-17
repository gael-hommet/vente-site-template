import { renderText, type ContentValue } from "@/ace/content";
import { cn } from "@/lib/utils";

/**
 * Renders a ContentValue<string>. Verified values print as-is; unconfirmed
 * ones print the visible [À CONFIRMER] mark in a subdued style — impossible
 * to mistake for a real claim, ugly enough that nobody ships it by accident.
 */
export function ToConfirmValue({
  value,
  className,
}: {
  value: ContentValue<string>;
  className?: string;
}) {
  const text = renderText(value);
  const pending = value.status === "to-confirm";
  return (
    <span
      className={cn(pending && "text-muted border-warning/60 border-b border-dashed", className)}
    >
      {text}
      {pending && value.note ? <span className="sr-only"> ({value.note})</span> : null}
    </span>
  );
}

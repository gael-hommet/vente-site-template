/**
 * ace-content — content integrity as a type. The house rule "never invent
 * client facts" becomes a value-level distinction: a piece of content is
 * either `verified` (came from the brief / a confirmed source) or `toConfirm`
 * (a placeholder that MUST be visibly marked and resolved before production).
 */

export const TO_CONFIRM_MARK = "[À CONFIRMER]";

export type ContentValue<T> =
  | { status: "verified"; value: T; source?: string }
  | { status: "to-confirm"; draft?: T; note?: string };

export function verified<T>(value: T, source?: string): ContentValue<T> {
  return { status: "verified", value, source };
}

export function toConfirm<T>(draft?: T, note?: string): ContentValue<T> {
  return { status: "to-confirm", draft, note };
}

/**
 * Renders a text content value. Unverified content ALWAYS carries the visible
 * mark — there is no way to print a draft as if it were a fact.
 */
export function renderText(content: ContentValue<string>): string {
  if (content.status === "verified") return content.value;
  return content.draft ? `${content.draft} ${TO_CONFIRM_MARK}` : TO_CONFIRM_MARK;
}

/** True if any provided content value still awaits confirmation. */
export function hasUnconfirmed(values: readonly ContentValue<unknown>[]): boolean {
  return values.some((v) => v.status === "to-confirm");
}

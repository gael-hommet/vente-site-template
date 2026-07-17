/**
 * ace-forms — shared validation + client submission. Schemas are the single
 * source of truth for client (react-hook-form resolver) AND server (API
 * route). Server-side delivery (src/lib/forms/deliver.ts) is `server-only`
 * and intentionally NOT re-exported here.
 */

export {
  leadSchema,
  contactSchema,
  quoteSchema,
  schemaByKind,
  type LeadInput,
  type ContactInput,
  type QuoteInput,
  type FormKind,
} from "@/lib/forms/schemas";
export { submitForm, type SubmitResult } from "@/lib/forms/submit";
export type { LeadAdapterContract } from "./contracts";

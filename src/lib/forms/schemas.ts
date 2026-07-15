import { z } from "zod";

/**
 * Shared form schemas (zod v4). Used on the client (react-hook-form resolver)
 * AND on the server (API route) — one source of truth. Every form includes a
 * honeypot (`company`) and a client timestamp for spam heuristics.
 */

const antiSpam = {
  /** Honeypot: real users leave this empty; bots fill it. */
  company: z.string().max(0).optional().or(z.literal("")),
  /** ms epoch when the form was rendered; used to reject instant submissions. */
  startedAt: z.number().optional(),
};

export const leadSchema = z.object({
  name: z.string().min(2, "Nom trop court").max(120),
  email: z.string().email("Email invalide"),
  phone: z
    .string()
    .min(6, "Téléphone invalide")
    .max(30)
    .regex(/^[+()\d\s.-]+$/, "Téléphone invalide")
    .optional()
    .or(z.literal("")),
  message: z.string().max(2000).optional().or(z.literal("")),
  consent: z.boolean().refine((v) => v === true, "Consentement requis"),
  ...antiSpam,
});

export const contactSchema = z.object({
  name: z.string().min(2, "Nom trop court").max(120),
  email: z.string().email("Email invalide"),
  message: z.string().min(10, "Message trop court").max(2000),
  consent: z.boolean().refine((v) => v === true, "Consentement requis"),
  ...antiSpam,
});

export const quoteSchema = z.object({
  name: z.string().min(2, "Nom trop court").max(120),
  email: z.string().email("Email invalide"),
  phone: z.string().max(30).optional().or(z.literal("")),
  service: z.string().min(1, "Sélectionnez un service"),
  budget: z.string().optional().or(z.literal("")),
  details: z.string().max(2000).optional().or(z.literal("")),
  consent: z.boolean().refine((v) => v === true, "Consentement requis"),
  ...antiSpam,
});

export type LeadInput = z.infer<typeof leadSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type QuoteInput = z.infer<typeof quoteSchema>;

export type FormKind = "lead" | "contact" | "quote";

export const schemaByKind = {
  lead: leadSchema,
  contact: contactSchema,
  quote: quoteSchema,
} as const;

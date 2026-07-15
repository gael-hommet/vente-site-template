import { describe, it, expect } from "vitest";
import { leadSchema, contactSchema, quoteSchema, schemaByKind } from "@/lib/forms/schemas";
import type { ZodError } from "zod";

/** Return the first error message zod produced for a given top-level field. */
function messageFor(error: ZodError, field: string): string | undefined {
  return error.issues.find((issue) => issue.path[0] === field)?.message;
}

describe("leadSchema", () => {
  it("accepts a fully valid lead (with empty honeypot)", () => {
    const result = leadSchema.safeParse({
      name: "Jean Dupont",
      email: "jean@example.com",
      phone: "+33 1 23 45 67 89",
      message: "Bonjour, je souhaite un devis.",
      consent: true,
      company: "",
      startedAt: Date.now(),
    });
    expect(result.success).toBe(true);
  });

  it("accepts a minimal valid lead (optional fields omitted)", () => {
    const result = leadSchema.safeParse({
      name: "Al",
      email: "al@example.com",
      consent: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email with the expected message", () => {
    const result = leadSchema.safeParse({
      name: "Jean Dupont",
      email: "not-an-email",
      consent: true,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(messageFor(result.error, "email")).toBe("Email invalide");
    }
  });

  it("rejects a name that is too short", () => {
    const result = leadSchema.safeParse({
      name: "J",
      email: "jean@example.com",
      consent: true,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(messageFor(result.error, "name")).toBe("Nom trop court");
    }
  });

  it("rejects a missing consent", () => {
    const result = leadSchema.safeParse({
      name: "Jean Dupont",
      email: "jean@example.com",
      consent: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(messageFor(result.error, "consent")).toBe("Consentement requis");
    }
  });

  it("rejects an invalid phone format", () => {
    const result = leadSchema.safeParse({
      name: "Jean Dupont",
      email: "jean@example.com",
      phone: "not a phone!!",
      consent: true,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(messageFor(result.error, "phone")).toBe("Téléphone invalide");
    }
  });

  it("rejects a filled honeypot (company non-empty)", () => {
    const result = leadSchema.safeParse({
      name: "Jean Dupont",
      email: "jean@example.com",
      consent: true,
      company: "spam-bot-value",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(messageFor(result.error, "company")).toBeDefined();
    }
  });
});

describe("contactSchema", () => {
  it("accepts a valid contact message", () => {
    const result = contactSchema.safeParse({
      name: "Marie Martin",
      email: "marie@example.com",
      message: "Voici un message suffisamment long.",
      consent: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a message that is too short", () => {
    const result = contactSchema.safeParse({
      name: "Marie Martin",
      email: "marie@example.com",
      message: "trop court",
      consent: true,
    });
    // "trop court" is exactly 10 chars → passes; use a shorter one to fail.
    expect(result.success).toBe(true);

    const short = contactSchema.safeParse({
      name: "Marie Martin",
      email: "marie@example.com",
      message: "court",
      consent: true,
    });
    expect(short.success).toBe(false);
    if (!short.success) {
      expect(messageFor(short.error, "message")).toBe("Message trop court");
    }
  });

  it("rejects an empty submission with multiple field errors", () => {
    const result = contactSchema.safeParse({
      name: "",
      email: "",
      message: "",
      consent: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(messageFor(result.error, "name")).toBe("Nom trop court");
      expect(messageFor(result.error, "email")).toBe("Email invalide");
      expect(messageFor(result.error, "message")).toBe("Message trop court");
      expect(messageFor(result.error, "consent")).toBe("Consentement requis");
    }
  });
});

describe("quoteSchema", () => {
  it("accepts a valid quote request", () => {
    const result = quoteSchema.safeParse({
      name: "Paul Bernard",
      email: "paul@example.com",
      service: "renovation",
      consent: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a quote with no selected service", () => {
    const result = quoteSchema.safeParse({
      name: "Paul Bernard",
      email: "paul@example.com",
      service: "",
      consent: true,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(messageFor(result.error, "service")).toBe("Sélectionnez un service");
    }
  });
});

describe("schemaByKind", () => {
  it("maps each form kind to its schema", () => {
    expect(schemaByKind.lead).toBe(leadSchema);
    expect(schemaByKind.contact).toBe(contactSchema);
    expect(schemaByKind.quote).toBe(quoteSchema);
  });
});

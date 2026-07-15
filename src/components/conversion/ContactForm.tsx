"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactSchema, type ContactInput } from "@/lib/forms/schemas";
import { submitForm } from "@/lib/forms/submit";
import { track } from "@/lib/analytics/track";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";
import { Honeypot, LabeledField, FormSuccess } from "./form-parts";

/** General contact form (message-oriented). Same accessibility + anti-spam. */
export function ContactForm({ className }: { className?: string }) {
  const [done, setDone] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const started = React.useRef(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { consent: false },
  });

  React.useEffect(() => setValue("startedAt", Date.now()), [setValue]);

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const res = await submitForm("contact", values);
    if (res.ok) {
      track("form_submitted", { form: "contact" });
      setDone(true);
    } else setServerError("Envoi impossible pour le moment. Réessayez.");
  });

  if (done) return <FormSuccess title="Message envoyé" description="Merci, nous vous répondrons vite." />;

  return (
    <form
      onSubmit={onSubmit}
      onFocus={() => {
        if (!started.current) {
          started.current = true;
          track("form_started", { form: "contact" });
        }
      }}
      className={className}
      noValidate
    >
      <Honeypot register={register("company")} />
      <div className="flex flex-col gap-4">
        <LabeledField id="c-name" label="Nom" required error={errors.name?.message}>
          {(aria) => <Input autoComplete="name" {...aria} {...register("name")} />}
        </LabeledField>
        <LabeledField id="c-email" label="Email" required error={errors.email?.message}>
          {(aria) => <Input type="email" autoComplete="email" {...aria} {...register("email")} />}
        </LabeledField>
        <LabeledField id="c-message" label="Message" required error={errors.message?.message}>
          {(aria) => <Textarea rows={5} {...aria} {...register("message")} />}
        </LabeledField>
        <label className="flex items-start gap-2 text-sm text-muted">
          <input type="checkbox" className="mt-1 accent-brand" {...register("consent")} />
          <span>
            J&apos;accepte d&apos;être recontacté.
            {errors.consent && <span className="block text-danger">{errors.consent.message}</span>}
          </span>
        </label>
        {serverError && (
          <p role="alert" className="text-sm text-danger">
            {serverError}
          </p>
        )}
        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Envoi…" : "Envoyer"}
        </Button>
      </div>
    </form>
  );
}

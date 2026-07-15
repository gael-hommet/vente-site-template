"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leadSchema, type LeadInput } from "@/lib/forms/schemas";
import { submitForm } from "@/lib/forms/submit";
import { track } from "@/lib/analytics/track";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";
import { Honeypot, LabeledField, FormSuccess } from "./form-parts";

export interface LeadFormProps {
  title?: string;
  className?: string;
}

/**
 * Primary lead-capture form. react-hook-form + zod, fully accessible (labels,
 * aria-invalid, error alerts), honeypot + timing spam protection, local
 * simulated endpoint in dev. Fires form_started / form_submitted analytics.
 */
export function LeadForm({ className }: LeadFormProps) {
  const [done, setDone] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const startedRef = React.useRef(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LeadInput>({
    resolver: zodResolver(leadSchema),
    defaultValues: { consent: false },
  });

  React.useEffect(() => {
    setValue("startedAt", Date.now());
  }, [setValue]);

  const onFirstInteract = () => {
    if (!startedRef.current) {
      startedRef.current = true;
      track("form_started", { form: "lead" });
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const res = await submitForm("lead", values);
    if (res.ok) {
      track("form_submitted", { form: "lead" });
      setDone(true);
    } else {
      setServerError("Envoi impossible pour le moment. Réessayez dans un instant.");
    }
  });

  if (done) {
    return (
      <FormSuccess
        title="Merci, votre demande est bien reçue"
        description="Nous revenons vers vous rapidement."
      />
    );
  }

  return (
    <form onSubmit={onSubmit} onFocus={onFirstInteract} className={className} noValidate>
      <Honeypot register={register("company")} />
      <div className="flex flex-col gap-4">
        <LabeledField id="lead-name" label="Nom" required error={errors.name?.message}>
          {(aria) => <Input autoComplete="name" {...aria} {...register("name")} />}
        </LabeledField>
        <LabeledField id="lead-email" label="Email" required error={errors.email?.message}>
          {(aria) => <Input type="email" autoComplete="email" {...aria} {...register("email")} />}
        </LabeledField>
        <LabeledField id="lead-phone" label="Téléphone" error={errors.phone?.message}>
          {(aria) => <Input type="tel" autoComplete="tel" {...aria} {...register("phone")} />}
        </LabeledField>
        <LabeledField id="lead-message" label="Message" error={errors.message?.message}>
          {(aria) => <Textarea rows={4} {...aria} {...register("message")} />}
        </LabeledField>

        <label className="flex items-start gap-2 text-sm text-muted">
          <input type="checkbox" className="mt-1 accent-brand" {...register("consent")} />
          <span>
            J&apos;accepte d&apos;être recontacté au sujet de ma demande.
            {errors.consent && <span className="block text-danger">{errors.consent.message}</span>}
          </span>
        </label>

        {serverError && (
          <p role="alert" className="text-sm text-danger">
            {serverError}
          </p>
        )}

        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Envoi…" : "Envoyer ma demande"}
        </Button>
      </div>
    </form>
  );
}

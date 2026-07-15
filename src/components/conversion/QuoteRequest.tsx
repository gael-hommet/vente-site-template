"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { quoteSchema, type QuoteInput } from "@/lib/forms/schemas";
import { submitForm } from "@/lib/forms/submit";
import { track } from "@/lib/analytics/track";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/field";
import { Honeypot, LabeledField, FormSuccess } from "./form-parts";

export interface QuoteRequestProps {
  services: string[];
  className?: string;
}

/** Quote request with a service selector. Services come from the brief. */
export function QuoteRequest({ services, className }: QuoteRequestProps) {
  const [done, setDone] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const started = React.useRef(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<QuoteInput>({
    resolver: zodResolver(quoteSchema),
    defaultValues: { consent: false, service: services[0] ?? "" },
  });

  React.useEffect(() => setValue("startedAt", Date.now()), [setValue]);

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const res = await submitForm("quote", values);
    if (res.ok) {
      track("form_submitted", { form: "quote" });
      setDone(true);
    } else setServerError("Envoi impossible pour le moment. Réessayez.");
  });

  if (done)
    return <FormSuccess title="Demande de devis reçue" description="Nous préparons votre proposition." />;

  return (
    <form
      onSubmit={onSubmit}
      onFocus={() => {
        if (!started.current) {
          started.current = true;
          track("form_started", { form: "quote" });
        }
      }}
      className={className}
      noValidate
    >
      <Honeypot register={register("company")} />
      <div className="flex flex-col gap-4">
        <LabeledField id="q-name" label="Nom" required error={errors.name?.message}>
          {(aria) => <Input autoComplete="name" {...aria} {...register("name")} />}
        </LabeledField>
        <LabeledField id="q-email" label="Email" required error={errors.email?.message}>
          {(aria) => <Input type="email" autoComplete="email" {...aria} {...register("email")} />}
        </LabeledField>
        <LabeledField id="q-phone" label="Téléphone" error={errors.phone?.message}>
          {(aria) => <Input type="tel" autoComplete="tel" {...aria} {...register("phone")} />}
        </LabeledField>
        <LabeledField id="q-service" label="Service" required error={errors.service?.message}>
          {(aria) => (
            <Select {...aria} {...register("service")}>
              {services.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          )}
        </LabeledField>
        <LabeledField id="q-details" label="Détails" error={errors.details?.message}>
          {(aria) => <Textarea rows={4} {...aria} {...register("details")} />}
        </LabeledField>
        <label className="flex items-start gap-2 text-sm text-muted">
          <input type="checkbox" className="mt-1 accent-brand" {...register("consent")} />
          <span>
            J&apos;accepte d&apos;être recontacté pour ce devis.
            {errors.consent && <span className="block text-danger">{errors.consent.message}</span>}
          </span>
        </label>
        {serverError && (
          <p role="alert" className="text-sm text-danger">
            {serverError}
          </p>
        )}
        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Envoi…" : "Demander un devis"}
        </Button>
      </div>
    </form>
  );
}

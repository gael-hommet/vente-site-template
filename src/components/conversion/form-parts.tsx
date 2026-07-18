"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { Field, Label, FieldError } from "@/components/ui/field";

/** Honeypot input — visually hidden, off the tab order. Bots fill it. */
export function Honeypot({ register }: { register: React.InputHTMLAttributes<HTMLInputElement> }) {
  return (
    <div aria-hidden className="absolute top-0 left-[-9999px] h-0 w-0 overflow-hidden">
      <label>
        Société (ne pas remplir)
        <input tabIndex={-1} autoComplete="off" {...register} />
      </label>
    </div>
  );
}

/** Labelled field wrapper wiring aria-describedby to the error. */
export function LabeledField({
  id,
  label,
  error,
  children,
  required,
}: {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  children: (aria: {
    id: string;
    "aria-invalid": boolean;
    "aria-describedby"?: string;
  }) => React.ReactNode;
}) {
  const errorId = `${id}-error`;
  return (
    <Field>
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-danger"> *</span>}
      </Label>
      {children({
        id,
        "aria-invalid": Boolean(error),
        "aria-describedby": error ? errorId : undefined,
      })}
      <FieldError id={errorId}>{error}</FieldError>
    </Field>
  );
}

/**
 * Success panel shown after a submission. On mount it takes focus so keyboard
 * users don't land on <body> (the submitted form is unmounted) and screen
 * readers reliably announce the confirmation (role="status" + moved focus).
 */
export function FormSuccess({ title, description }: { title: string; description?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <div
      ref={ref}
      role="status"
      tabIndex={-1}
      className="border-success/30 bg-success/10 flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border p-8 text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
    >
      <CheckCircle2 className="text-success size-8" aria-hidden />
      <p className="text-foreground text-lg font-semibold">{title}</p>
      {description && <p className="text-muted max-w-sm text-sm">{description}</p>}
    </div>
  );
}

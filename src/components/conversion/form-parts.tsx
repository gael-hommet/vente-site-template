"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { Field, Label, FieldError } from "@/components/ui/field";

/** Honeypot input — visually hidden, off the tab order. Bots fill it. */
export function Honeypot({ register }: { register: React.InputHTMLAttributes<HTMLInputElement> }) {
  return (
    <div aria-hidden className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
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
  children: (aria: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => React.ReactNode;
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

/** Success panel shown after a submission. */
export function FormSuccess({ title, description }: { title: string; description?: string }) {
  return (
    <div
      role="status"
      className="flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border border-success/30 bg-success/10 p-8 text-center"
    >
      <CheckCircle2 className="size-8 text-success" aria-hidden />
      <p className="text-lg font-semibold text-foreground">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted">{description}</p>}
    </div>
  );
}

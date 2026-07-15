"use client";

import type { FormKind } from "./schemas";

export interface SubmitResult {
  ok: boolean;
  error?: string;
  simulated?: boolean;
}

/** POSTs a validated payload to the local /api/lead endpoint. */
export async function submitForm(
  kind: FormKind,
  data: Record<string, unknown>,
): Promise<SubmitResult> {
  try {
    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, data }),
    });
    const json = (await res.json().catch(() => ({ ok: false }))) as {
      ok?: boolean;
      error?: string;
      simulated?: boolean;
    };
    return { ok: Boolean(res.ok && json.ok), error: json.error, simulated: json.simulated };
  } catch {
    return { ok: false, error: "network" };
  }
}

import type { FormKind } from "@/lib/forms/schemas";

/**
 * Delivery-adapter contract. Adapters are env-gated: `isEnabled` reads only
 * environment variables, and with no adapter enabled the engine falls back to
 * the local simulated logger (dev). Implementations live server-side only
 * (see src/lib/forms/deliver.ts) — never import them from client code.
 */
export interface LeadAdapterContract {
  /** Stable id, e.g. "resend", "crm-webhook". */
  id: string;
  /** Which env vars enable this adapter (documented in .env.example). */
  requiredEnv: readonly string[];
  /** True only when every required env var is present. */
  isEnabled(env: NodeJS.ProcessEnv): boolean;
  /** Delivers a validated lead. Must never throw into the user's submission. */
  deliver(kind: FormKind, data: Record<string, unknown>): Promise<boolean>;
}

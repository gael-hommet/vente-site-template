import "server-only";
import type { FormKind } from "./schemas";

/**
 * Server-side lead delivery. Every adapter is OFF unless its env var(s) are set,
 * so the template works with a purely local, simulated endpoint in development
 * (leads are logged, nothing leaves the machine). Enabling an adapter is a
 * deliberate opt-in via .env — see docs/OPTIONAL-INTEGRATIONS.md.
 */

export interface DeliveryResult {
  ok: boolean;
  channels: string[];
  simulated: boolean;
}

export async function deliverLead(
  kind: FormKind,
  data: Record<string, unknown>,
): Promise<DeliveryResult> {
  const channels: string[] = [];
  let anyRealChannel = false;

  // 1. Resend transactional email (env-gated).
  const resendKey = process.env.RESEND_API_KEY;
  const notify = process.env.LEAD_NOTIFY_EMAIL;
  if (resendKey && notify) {
    anyRealChannel = true;
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Vente Site Engine <onboarding@resend.dev>",
          to: [notify],
          subject: `Nouveau lead (${kind})`,
          text: JSON.stringify(data, null, 2),
        }),
      });
      if (res.ok) channels.push("resend");
    } catch {
      /* swallow — never fail the user's submission on a delivery error */
    }
  }

  // 2. Generic CRM / automation webhook (env-gated).
  const webhook = process.env.CRM_WEBHOOK_URL;
  if (webhook) {
    anyRealChannel = true;
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, data, at: new Date().toISOString() }),
      });
      if (res.ok) channels.push("webhook");
    } catch {
      /* swallow */
    }
  }

  // 3. Local dev logger (always, when no real channel is configured).
  if (!anyRealChannel) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.info(`\n📥 [lead:${kind}] (simulé — aucun envoi externe)\n`, data, "\n");
    }
    return { ok: true, channels: ["local-log"], simulated: true };
  }

  return { ok: channels.length > 0, channels, simulated: false };
}

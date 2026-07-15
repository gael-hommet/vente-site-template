import { NextResponse } from "next/server";
import { schemaByKind, type FormKind } from "@/lib/forms/schemas";
import { deliverLead } from "@/lib/forms/deliver";

export const runtime = "nodejs";

/** Naive in-memory rate limit (per-instance; replace with a store in prod). */
const hits = new Map<string, { count: number; ts: number }>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 8;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now - rec.ts > WINDOW_MS) {
    hits.set(ip, { count: 1, ts: now });
    return false;
  }
  rec.count += 1;
  return rec.count > MAX_PER_WINDOW;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(ip)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const kind = (typeof body === "object" && body && "kind" in body ? (body as { kind: string }).kind : "") as FormKind;
  const schema = schemaByKind[kind];
  if (!schema) {
    return NextResponse.json({ ok: false, error: "unknown_form" }, { status: 400 });
  }

  const parsed = schema.safeParse((body as { data?: unknown }).data);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "validation", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const data = parsed.data as Record<string, unknown>;

  // Spam heuristics: honeypot filled, or submitted implausibly fast.
  if (typeof data.company === "string" && data.company.length > 0) {
    // Pretend success so bots don't learn; drop silently.
    return NextResponse.json({ ok: true, dropped: true });
  }
  if (typeof data.startedAt === "number" && Date.now() - data.startedAt < 1200) {
    return NextResponse.json({ ok: false, error: "too_fast" }, { status: 422 });
  }

  // Strip anti-spam fields before delivery.
  const { company: _c, startedAt: _s, ...clean } = data;
  void _c;
  void _s;

  const result = await deliverLead(kind, clean);
  return NextResponse.json({ ok: result.ok, simulated: result.simulated });
}

import { NextResponse } from 'next/server';
import { previewSchema } from '../../../lib/verify';

const API = process.env.PROVIDER_API_URL?.replace(/\/$/, '');

/**
 * Playground preview. Prefers the live provider's free `/api/try` engine (runs
 * all three services). Falls back to local ajv schema validation when no
 * provider is configured (local dev).
 */
export async function POST(req: Request) {
  let body: { service?: string } & Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  if (API) {
    try {
      const r = await fetch(`${API}/api/try`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        cache: 'no-store',
      });
      const j = await r.json();
      if (!r.ok) return NextResponse.json({ mode: 'error', ...j }, { status: r.status });
      return NextResponse.json({ mode: 'preview', ...j });
    } catch {
      return NextResponse.json({ mode: 'error', error: 'provider unreachable' }, { status: 502 });
    }
  }

  // Local fallback: schema validation only (no LLM/search without a provider).
  if (body.service === 'schema') {
    return NextResponse.json({ mode: 'preview', report: previewSchema(body.output, body.expected_schema) });
  }
  return NextResponse.json({
    mode: 'order-required',
    message: 'Grounding and fact-check need a running provider (set PROVIDER_API_URL) or the CLI requester.',
  });
}

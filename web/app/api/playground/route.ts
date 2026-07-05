import { NextResponse } from 'next/server';
import { previewSchema } from '../../../lib/verify';

/**
 * Playground preview. The schema service runs the real ajv logic inline (no
 * payment needed). Grounding and fact-check require a paid CAP order, so we
 * return the command to run the demo requester instead.
 */
export async function POST(req: Request) {
  let body: { service?: string; output?: unknown; expected_schema?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  if (body.service === 'schema') {
    return NextResponse.json({ mode: 'preview', report: previewSchema(body.output, body.expected_schema) });
  }

  return NextResponse.json({
    mode: 'order-required',
    message:
      'This service runs via a paid CAP order. Use the demo requester: ' +
      'CROO_TARGET_SERVICE_ID=<service-id> npm run requester',
  });
}

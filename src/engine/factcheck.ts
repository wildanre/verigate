import type { Verifier, VerificationResult, Verdict } from '../types.js';
import type { LLM } from './llm.js';
import type { SearchClient } from './search.js';

const MAX_CLAIMS = 5;

const EXTRACT_SYSTEM = `Extract up to 5 atomic, checkable factual claims from the text.
Return JSON: {"claims": string[]}.`;

const JUDGE_SYSTEM = `Given a CLAIM and web SOURCES, judge the claim.
Return JSON: {"result": "supported"|"refuted"|"unverifiable", "confidence": number between 0 and 1}.`;

interface Check {
  claim: string;
  result: string;
  confidence: number;
  sources: string[];
}

/** Build a fact-check verifier backed by an LLM and a web search client. */
export function makeFactCheck(llm: LLM, search: SearchClient): Verifier {
  return async (input: Record<string, unknown>): Promise<VerificationResult> => {
    const claims = await resolveClaims(input, llm);
    if (claims.length === 0) return graceful('provide `text` or a non-empty `claims` array');

    const checks: Check[] = [];
    for (const claim of claims) {
      const sources = await search.search(claim);
      const judged = await llm.completeJSON<{ result?: string; confidence?: number }>({
        system: JUDGE_SYSTEM,
        user: `CLAIM: ${claim}\n\nSOURCES:\n${sources.map((s) => `- ${s.title} (${s.url}): ${s.content}`).join('\n') || '(none found)'}`,
      });
      checks.push({
        claim,
        result: normalizeResult(judged.result),
        confidence: clamp01(Number(judged.confidence) || 0),
        sources: sources.map((s) => s.url),
      });
    }

    const { verdict, score } = aggregate(checks);
    // CROO's deliverable schema rejects arrays of objects (invalid_item_type),
    // so serialize each check to a readable string and flatten sources.
    return {
      verdict,
      score,
      checks: checks.map(
        (c) => `[${c.result}${c.confidence ? ` ${c.confidence}` : ''}] ${c.claim}${c.sources.length ? ` — ${c.sources.join(', ')}` : ''}`,
      ),
      sources: [...new Set(checks.flatMap((c) => c.sources))],
    };
  };
}

async function resolveClaims(input: Record<string, unknown>, llm: LLM): Promise<string[]> {
  if (Array.isArray(input.claims) && input.claims.length > 0) {
    return input.claims.map(String).slice(0, MAX_CLAIMS);
  }
  const text = String(input.text ?? '').trim();
  if (!text) return [];
  const ext = await llm.completeJSON<{ claims?: string[] }>({ system: EXTRACT_SYSTEM, user: text });
  return (ext.claims ?? []).map(String).slice(0, MAX_CLAIMS);
}

function aggregate(checks: Check[]): { verdict: Verdict; score: number } {
  const supported = checks.filter((c) => c.result === 'supported').length;
  const refuted = checks.filter((c) => c.result === 'refuted').length;
  const score = Math.round((supported / checks.length) * 100);
  let verdict: Verdict;
  if (refuted > 0) verdict = 'fail';
  else if (supported === checks.length) verdict = 'pass';
  else verdict = 'partial';
  return { verdict, score };
}

function normalizeResult(result: string | undefined): string {
  return result === 'supported' || result === 'refuted' ? result : 'unverifiable';
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function graceful(message: string): VerificationResult {
  return { verdict: 'fail', score: 0, checks: [], error: message };
}

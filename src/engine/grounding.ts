import type { Verifier, VerificationResult, Verdict } from '../types.js';
import type { LLM } from './llm.js';

const MAX_CHARS = 8000;

const SYSTEM = `You check whether a GENERATED text is grounded in a SOURCE text.
Score 0-100 how well every claim in GENERATED is supported by SOURCE.
List any sentences in GENERATED not supported by SOURCE.
Return JSON: {"grounding_score": number, "unsupported_sentences": string[], "verdict": "pass"|"partial"|"fail"}.`;

interface GroundingResponse {
  grounding_score: number;
  unsupported_sentences?: string[];
  verdict?: string;
}

/** Build a grounding/hallucination verifier backed by the given LLM. */
export function makeGroundingCheck(llm: LLM): Verifier {
  return async (input: Record<string, unknown>): Promise<VerificationResult> => {
    const source = String(input.source_text ?? '').trim();
    const generated = String(input.generated_text ?? '').trim();
    if (!source || !generated) return graceful();

    const res = await llm.completeJSON<GroundingResponse>({
      system: SYSTEM,
      user: `SOURCE:\n${source.slice(0, MAX_CHARS)}\n\nGENERATED:\n${generated.slice(0, MAX_CHARS)}`,
    });

    const score = clamp(Number(res.grounding_score) || 0, 0, 100);
    const unsupported = res.unsupported_sentences ?? [];
    return {
      verdict: normalizeVerdict(res.verdict, score),
      score,
      grounding_score: score,
      unsupported_sentences: unsupported,
    };
  };
}

function normalizeVerdict(verdict: string | undefined, score: number): Verdict {
  if (verdict === 'pass' || verdict === 'fail' || verdict === 'partial') return verdict;
  if (score >= 80) return 'pass';
  if (score >= 50) return 'partial';
  return 'fail';
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function graceful(): VerificationResult {
  return {
    verdict: 'fail',
    score: 0,
    grounding_score: 0,
    unsupported_sentences: [],
    error: 'source_text and generated_text are both required',
  };
}

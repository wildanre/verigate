import { Ajv, type ErrorObject } from 'ajv';
import type { VerificationResult } from '../types.js';

const ajv = new Ajv({ allErrors: true, strict: false });

/**
 * Deterministic output validation against a JSON Schema. Never throws on bad
 * input — a malformed or missing `expected_schema` yields a graceful `fail`
 * verdict so a paid order still receives an actionable report.
 */
export async function validateSchema(input: Record<string, unknown>): Promise<VerificationResult> {
  const output = (input as { output?: unknown }).output;
  const expected = (input as { expected_schema?: unknown }).expected_schema;

  if (expected == null || typeof expected !== 'object' || Array.isArray(expected)) {
    return graceful('expected_schema is missing or not a JSON Schema object');
  }

  let validate;
  try {
    validate = ajv.compile(expected as object);
  } catch (e) {
    return graceful(`invalid expected_schema: ${(e as Error).message}`);
  }

  const valid = validate(output);
  const violations = (validate.errors ?? []).map(formatError);
  return {
    verdict: valid ? 'pass' : 'fail',
    score: valid ? 100 : Math.max(0, 100 - violations.length * 10),
    violations,
    suggestions: valid ? [] : ['Fix the listed fields so output conforms to expected_schema'],
  };
}

function formatError(e: ErrorObject): string {
  const path = e.instancePath || '(root)';
  return `${path} ${e.message ?? 'is invalid'}`.trim();
}

function graceful(message: string): VerificationResult {
  return {
    verdict: 'fail',
    score: 0,
    violations: [message],
    suggestions: ['Provide a valid JSON Schema object in expected_schema'],
  };
}

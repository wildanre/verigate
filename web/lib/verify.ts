import { Ajv } from 'ajv';

const ajv = new Ajv({ allErrors: true, strict: false });

export interface PreviewResult {
  verdict: 'pass' | 'fail';
  violations: string[];
}

/**
 * Client-facing preview of the schema-validation service. Runs the same ajv
 * logic as the provider's verifier so the playground can show a result without
 * placing a paid CAP order.
 */
export function previewSchema(output: unknown, expected: unknown): PreviewResult {
  if (expected == null || typeof expected !== 'object' || Array.isArray(expected)) {
    return { verdict: 'fail', violations: ['expected_schema is missing or not a JSON Schema object'] };
  }
  let validate;
  try {
    validate = ajv.compile(expected as object);
  } catch (e) {
    return { verdict: 'fail', violations: [`invalid expected_schema: ${(e as Error).message}`] };
  }
  const ok = validate(output);
  return {
    verdict: ok ? 'pass' : 'fail',
    violations: (validate.errors ?? []).map((e) => `${e.instancePath || '(root)'} ${e.message ?? ''}`.trim()),
  };
}

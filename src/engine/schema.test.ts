import { describe, it, expect } from 'vitest';
import { validateSchema } from './schema.js';

const personSchema = {
  type: 'object',
  required: ['name', 'age'],
  properties: {
    name: { type: 'string' },
    age: { type: 'number' },
  },
};

describe('validateSchema', () => {
  it('passes a conforming output', async () => {
    const r = await validateSchema({ output: { name: 'Ada', age: 36 }, expected_schema: personSchema });
    expect(r.verdict).toBe('pass');
    expect(r.violations).toEqual([]);
    expect(r.score).toBe(100);
  });

  it('fails and names the violation for a missing required field', async () => {
    const r = await validateSchema({ output: { name: 'Ada' }, expected_schema: personSchema });
    expect(r.verdict).toBe('fail');
    expect((r.violations as string[]).join(' ')).toMatch(/age/);
  });

  it('fails on a wrong type', async () => {
    const r = await validateSchema({ output: { name: 'Ada', age: 'old' }, expected_schema: personSchema });
    expect(r.verdict).toBe('fail');
    expect((r.violations as string[]).join(' ')).toMatch(/age/);
  });

  it('degrades gracefully when expected_schema is missing (no throw)', async () => {
    const r = await validateSchema({ output: { name: 'Ada' } });
    expect(r.verdict).toBe('fail');
    expect((r.violations as string[])[0]).toMatch(/expected_schema/);
  });

  it('degrades gracefully when expected_schema is malformed (no throw)', async () => {
    const r = await validateSchema({ output: {}, expected_schema: { type: 'not-a-real-type' } });
    expect(r.verdict).toBe('fail');
    expect(r.violations).toBeDefined();
  });
});

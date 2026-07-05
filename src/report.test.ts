import { describe, it, expect } from 'vitest';
import { buildReport } from './report.js';

const fixedNow = () => new Date('2026-07-07T10:00:00.000Z');

describe('buildReport', () => {
  it('adds provenance and a report hash', () => {
    const r = buildReport({ verdict: 'pass', score: 90 }, { now: fixedNow });
    expect(r.verdict).toBe('pass');
    expect(r.verified_by).toBe('VeriGate v1.0');
    expect(r.timestamp).toBe('2026-07-07T10:00:00.000Z');
    expect(r.report_hash).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it('produces a stable hash for identical input and clock', () => {
    const a = buildReport({ verdict: 'fail', score: 10 }, { now: fixedNow });
    const b = buildReport({ verdict: 'fail', score: 10 }, { now: fixedNow });
    expect(a.report_hash).toBe(b.report_hash);
  });

  it('changes the hash when content changes', () => {
    const a = buildReport({ verdict: 'pass' }, { now: fixedNow });
    const b = buildReport({ verdict: 'fail' }, { now: fixedNow });
    expect(a.report_hash).not.toBe(b.report_hash);
  });
});

import { keccak256, toUtf8Bytes } from 'ethers';
import type { VerificationResult, VerificationReport } from './types.js';

export interface BuildReportOptions {
  verifiedBy?: string;
  /** Injectable clock for deterministic tests. */
  now?: () => Date;
}

/**
 * Wrap a verifier result into a signed report: adds provenance (verified_by,
 * timestamp) and a keccak256 hash over the core content. The hash is a
 * supplementary integrity marker; CAP also writes its own contentHash on-chain.
 */
export function buildReport(result: VerificationResult, opts: BuildReportOptions = {}): VerificationReport {
  const core = {
    ...result,
    verified_by: opts.verifiedBy ?? 'VeriGate v1.0',
    timestamp: (opts.now?.() ?? new Date()).toISOString(),
  };
  const report_hash = keccak256(toUtf8Bytes(JSON.stringify(core)));
  return { ...core, report_hash };
}

/** Shared domain types for the verification engine and reports. */

export type Verdict = 'pass' | 'fail' | 'partial';

/** The verifier-produced body of a report, before signing metadata is added. */
export interface VerificationResult {
  verdict: Verdict;
  score?: number;
  [key: string]: unknown;
}

/** A full report as delivered on-chain: result + provenance + content hash. */
export interface VerificationReport extends VerificationResult {
  verified_by: string;
  timestamp: string;
  report_hash: string;
}

/** A verifier takes the parsed order requirements and returns a result body. */
export type Verifier = (input: Record<string, unknown>) => Promise<VerificationResult>;

/** Which service a verifier serves, for routing by serviceId. */
export type ServiceKind = 'factcheck' | 'schema' | 'grounding';

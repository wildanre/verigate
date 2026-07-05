/**
 * Error taxonomy for VeriGate.
 *
 * The provider loop uses these classes to decide how to handle a failed order:
 * - `PermanentError` (and its subclass `InvalidInputError`) -> rejectOrder so the
 *   escrow refunds; retrying would never succeed.
 * - `TransientError` (and any unclassified error) -> retry with backoff, since the
 *   failure may be a temporary LLM/search/network hiccup.
 */

export class PermanentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermanentError';
  }
}

/** Malformed or missing order requirements — never recoverable by retry. */
export class InvalidInputError extends PermanentError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidInputError';
  }
}

/** A temporary failure (LLM, web search, network). Safe to retry. */
export class TransientError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'TransientError';
  }
}

/** Thrown by config loading when required environment variables are absent. */
export class MissingEnvError extends Error {
  constructor(readonly missing: string[]) {
    super(`Missing required environment variables: ${missing.join(', ')}`);
    this.name = 'MissingEnvError';
  }
}

/** True when the error should cause the order to be rejected (not retried). */
export function isPermanent(err: unknown): err is PermanentError {
  return err instanceof PermanentError;
}

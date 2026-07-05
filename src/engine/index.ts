import type { Verifier, ServiceKind, VerificationReport } from '../types.js';
import { InvalidInputError } from '../errors.js';
import { buildReport } from '../report.js';

export interface ServiceIds {
  factcheck?: string;
  schema?: string;
  grounding?: string;
}

export interface EngineDeps {
  verifiers: Partial<Record<ServiceKind, Verifier>>;
  serviceIds: ServiceIds;
}

/** Minimal shape the engine needs from a CROO Order. */
export interface OrderLike {
  orderId: string;
  serviceId: string;
  requirements: string;
}

/** Map a CROO serviceId to a verifier kind using the configured id map. */
export function resolveKind(serviceId: string, ids: ServiceIds): ServiceKind | undefined {
  if (!serviceId) return undefined;
  if (serviceId === ids.schema) return 'schema';
  if (serviceId === ids.grounding) return 'grounding';
  if (serviceId === ids.factcheck) return 'factcheck';
  return undefined;
}

/** Parse the JSON-string requirements into an object, or throw InvalidInputError. */
export function parseRequirements(raw: string): Record<string, unknown> {
  if (typeof raw !== 'string' || raw.trim() === '') {
    throw new InvalidInputError('order requirements are empty');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new InvalidInputError('order requirements are not valid JSON');
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new InvalidInputError('order requirements must be a JSON object');
  }
  return parsed as Record<string, unknown>;
}

/**
 * Route a paid order to its verifier and return the signed report. Throws
 * InvalidInputError (permanent) for unknown services or malformed requirements;
 * verifier-internal transient failures propagate for the provider to retry.
 */
export async function runVerification(order: OrderLike, deps: EngineDeps): Promise<VerificationReport> {
  const kind = resolveKind(order.serviceId, deps.serviceIds);
  if (!kind) throw new InvalidInputError(`unknown serviceId: ${order.serviceId}`);
  const verifier = deps.verifiers[kind];
  if (!verifier) throw new InvalidInputError(`no verifier registered for kind: ${kind}`);

  const input = parseRequirements(order.requirements);
  const result = await verifier(input);
  return buildReport(result);
}

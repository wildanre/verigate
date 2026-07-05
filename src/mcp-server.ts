#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { AgentClient } from '@croo-network/sdk';
import { runRequester, type Delivery, type RequesterClient } from './requester.js';

/**
 * VeriGate MCP server. Exposes VeriGate's three verification services as MCP
 * tools. Each tool hires the deployed VeriGate agent over CROO CAP — it settles
 * a real USDC order and returns the on-chain-hashed verification report.
 *
 * Configure with a CROO **requester** agent SDK-Key (with USDC in its AA
 * wallet). All logging goes to stderr so it never corrupts the stdio protocol.
 */

const err = {
  info: (...a: unknown[]) => console.error('[verigate-mcp]', ...a),
  warn: (...a: unknown[]) => console.error('[verigate-mcp]', ...a),
  error: (...a: unknown[]) => console.error('[verigate-mcp]', ...a),
  debug: () => {},
};

// Deployed VeriGate service IDs (override via env if pointing at another instance).
const SERVICE_IDS = {
  schema: process.env.VERIGATE_SCHEMA_ID ?? '217e16a8-4180-44af-bfa3-cf870c8fd6a8',
  grounding: process.env.VERIGATE_GROUNDING_ID ?? 'd99ee10c-8ed6-4781-96e3-914e0eb9e8a5',
  factcheck: process.env.VERIGATE_FACTCHECK_ID ?? '8f88db1e-cd86-4487-95a9-f7829c02bf29',
};

export type RunOrder = (serviceId: string, requirements: string) => Promise<Delivery>;
export type Hire = (serviceId: string, requirements: Record<string, unknown>) => Promise<unknown>;

/** Parse the delivered report from a CAP delivery. */
export function parseDelivery(d: Delivery): unknown {
  return JSON.parse(d.deliverableSchema ?? d.deliverableText ?? '{}');
}

/**
 * Build a hire() that serializes orders — one WebSocket per requester key, so
 * concurrent tool calls must not open parallel connections. Each call waits for
 * the previous to settle, then places its own order.
 */
export function createHire(runOrder: RunOrder): Hire {
  let queue: Promise<unknown> = Promise.resolve();
  return (serviceId, requirements) => {
    const result = queue.then(() => runOrder(serviceId, JSON.stringify(requirements))).then(parseDelivery);
    queue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  };
}

function makeRunOrder(cfg: { apiURL: string; wsURL: string; sdkKey: string }): RunOrder {
  return (serviceId, requirements) => {
    const client = new AgentClient(
      { baseURL: cfg.apiURL, wsURL: cfg.wsURL, logger: err },
      cfg.sdkKey,
    ) as unknown as RequesterClient;
    return runRequester(client, { serviceId, requirements, logger: err });
  };
}

async function toResult(p: Promise<unknown>) {
  try {
    const report = await p;
    return { content: [{ type: 'text' as const, text: JSON.stringify(report, null, 2) }] };
  } catch (e) {
    return { content: [{ type: 'text' as const, text: `VeriGate error: ${(e as Error).message}` }], isError: true };
  }
}

/** Register the three verification tools on an McpServer. */
export function buildServer(hire: Hire): McpServer {
  const server = new McpServer({ name: 'verigate', version: '1.0.0' });

  server.registerTool(
    'verify_schema',
    {
      title: 'Verify output against a JSON Schema',
      description:
        'Hire VeriGate to validate an output against an expected JSON Schema. Settles a real CAP order (~0.015 USDC) and returns a verdict (pass/fail) with violations.',
      inputSchema: {
        output: z.any().describe('The value to validate'),
        expected_schema: z.record(z.string(), z.any()).describe('A JSON Schema the output must satisfy'),
        rules: z.array(z.string()).optional(),
      },
    },
    (args) => toResult(hire(SERVICE_IDS.schema, args)),
  );

  server.registerTool(
    'verify_grounding',
    {
      title: 'Check whether text is grounded in a source',
      description:
        'Hire VeriGate to detect hallucination: how well generated_text is supported by source_text. Settles a real CAP order (~0.02 USDC) and returns a grounding score plus unsupported sentences.',
      inputSchema: {
        source_text: z.string().describe('The trusted source'),
        generated_text: z.string().describe('The text to check against the source'),
      },
    },
    (args) => toResult(hire(SERVICE_IDS.grounding, args)),
  );

  server.registerTool(
    'fact_check',
    {
      title: 'Fact-check claims with web sources',
      description:
        'Hire VeriGate to fact-check claims against the web. Provide free text or an explicit claims array. Settles a real CAP order (~0.05 USDC) and returns per-claim verdicts with source URLs.',
      inputSchema: {
        text: z.string().optional().describe('Text to extract and check claims from'),
        claims: z.array(z.string()).optional().describe('Explicit claims to check'),
      },
    },
    (args) => toResult(hire(SERVICE_IDS.factcheck, args)),
  );

  return server;
}

async function main(): Promise<void> {
  const sdkKey = process.env.CROO_SDK_KEY;
  if (!sdkKey) {
    console.error('CROO_SDK_KEY (a CROO requester agent key with USDC) is required');
    process.exit(1);
  }
  const cfg = {
    apiURL: process.env.CROO_API_URL ?? 'https://api.croo.network',
    wsURL: process.env.CROO_WS_URL ?? 'wss://api.croo.network/ws',
    sdkKey,
  };
  const server = buildServer(createHire(makeRunOrder(cfg)));
  await server.connect(new StdioServerTransport());
  console.error('[verigate-mcp] ready — hiring VeriGate over CAP');
}

// Run only when executed directly (not when imported by tests).
import { pathToFileURL } from 'node:url';
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error('[verigate-mcp] fatal:', e);
    process.exit(1);
  });
}

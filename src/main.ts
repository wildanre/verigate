import { loadConfig, redactConfig } from './config.js';
import { createClient } from './cap/client.js';
import { OrderStore } from './store/orders.js';
import { startProvider, type ProviderDeps } from './provider.js';
import { validateSchema } from './engine/schema.js';
import { makeGroundingCheck } from './engine/grounding.js';
import { makeFactCheck } from './engine/factcheck.js';
import { createLLM } from './engine/llm.js';
import { TavilySearch } from './engine/search.js';
import type { Verifier } from './types.js';

/**
 * Provider entrypoint. Wires config -> CROO client -> engine -> store and goes
 * online. The deterministic schema verifier ships now; the grounding and
 * fact-check verifiers (U6, U7) register here once implemented.
 */
async function main(): Promise<void> {
  const cfg = loadConfig();
  console.log('VeriGate config:', redactConfig(cfg));

  const verifiers: Partial<Record<'schema' | 'grounding' | 'factcheck', Verifier>> = {
    schema: validateSchema,
  };

  if (cfg.anthropicApiKey) {
    const llm = createLLM(cfg.anthropicApiKey);
    verifiers.grounding = makeGroundingCheck(llm);
    if (cfg.tavilyApiKey) {
      verifiers.factcheck = makeFactCheck(llm, new TavilySearch(cfg.tavilyApiKey));
    } else {
      console.warn('TAVILY_API_KEY missing — fact-check verifier disabled');
    }
  } else {
    console.warn('ANTHROPIC_API_KEY missing — grounding & fact-check verifiers disabled');
  }

  const deps: ProviderDeps = {
    client: createClient(cfg),
    store: new OrderStore(cfg.dbPath),
    engine: { verifiers, serviceIds: cfg.serviceIds },
    logger: console,
  };

  const stream = await startProvider(deps);

  const shutdown = () => {
    console.log('shutting down...');
    stream.close?.();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('fatal:', err);
  process.exit(1);
});

import { pathToFileURL } from 'node:url';
import { runRequester } from '../src/requester.js';

// Re-export the core so existing importers/tests keep working from the demo path.
export * from '../src/requester.js';

// --- CLI entrypoint (only when run directly, not when imported) ---
async function main(): Promise<void> {
  const { loadConfig } = await import('../src/config.js');
  const { createClient } = await import('../src/cap/client.js');
  const cfg = loadConfig();
  const serviceId = process.env.CROO_TARGET_SERVICE_ID;
  if (!serviceId) throw new Error('CROO_TARGET_SERVICE_ID is required for the requester');

  const requirements =
    process.env.REQUIREMENTS ??
    JSON.stringify({
      source_text: 'Base is an Ethereum L2 with chain ID 8453.',
      generated_text: 'Base is an L2 with chain ID 8453, launched by Coinbase in 2019.',
    });

  const delivery = await runRequester(createClient(cfg), { serviceId, requirements });
  console.log('verification report:', delivery.deliverableSchema ?? delivery.deliverableText);
  process.exit(0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error('requester failed:', err.message);
    process.exit(1);
  });
}

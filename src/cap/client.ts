import { AgentClient } from '@croo-network/sdk';
import type { AppConfig } from '../config.js';

/** Build an authenticated CROO AgentClient from validated config. */
export function createClient(cfg: AppConfig): AgentClient {
  return new AgentClient(
    {
      baseURL: cfg.croo.apiURL,
      wsURL: cfg.croo.wsURL,
      rpcURL: cfg.croo.rpcURL,
      logger: console,
    },
    cfg.croo.sdkKey,
  );
}

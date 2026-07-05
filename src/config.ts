import { MissingEnvError } from './errors.js';

export interface CrooConfig {
  apiURL: string;
  wsURL: string;
  sdkKey: string;
  /** Optional custom Base RPC for balance checks; SDK defaults to Base mainnet. */
  rpcURL?: string;
}

/**
 * LLM connection. Supports a direct Anthropic key (x-api-key) or an
 * Anthropic-compatible gateway (e.g. Manifest) via base URL + bearer auth token.
 */
export interface LlmConfig {
  token?: string;
  /** True when the token is a bearer auth token (gateway); false for an Anthropic x-api-key. */
  useAuthToken: boolean;
  baseURL?: string;
  model?: string;
}

export interface AppConfig {
  croo: CrooConfig;
  /** CROO service IDs registered in the Dashboard, keyed by verifier kind. */
  serviceIds: {
    factcheck?: string;
    schema?: string;
    grounding?: string;
  };
  dbPath: string;
  llm: LlmConfig;
  tavilyApiKey?: string;
}

const REQUIRED = ['CROO_API_URL', 'CROO_WS_URL', 'CROO_SDK_KEY'] as const;

/**
 * Load and validate configuration from the environment. Pure function over the
 * passed env map so it is unit-testable. Throws {@link MissingEnvError} listing
 * every absent required variable (not just the first).
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const missing = REQUIRED.filter((k) => !env[k] || env[k]!.trim() === '');
  if (missing.length > 0) throw new MissingEnvError(missing);

  const authToken = env.ANTHROPIC_AUTH_TOKEN?.trim();
  const apiKey = env.ANTHROPIC_API_KEY?.trim();

  return {
    croo: {
      apiURL: env.CROO_API_URL!,
      wsURL: env.CROO_WS_URL!,
      sdkKey: env.CROO_SDK_KEY!,
      rpcURL: env.BASE_RPC_URL?.trim() || undefined,
    },
    serviceIds: {
      factcheck: env.SVC_FACTCHECK_ID?.trim() || undefined,
      schema: env.SVC_SCHEMA_ID?.trim() || undefined,
      grounding: env.SVC_GROUNDING_ID?.trim() || undefined,
    },
    dbPath: env.DB_PATH?.trim() || './data/verigate.db',
    llm: {
      token: authToken || apiKey || undefined,
      useAuthToken: !!authToken,
      baseURL: env.ANTHROPIC_BASE_URL?.trim() || undefined,
      model: env.ANTHROPIC_MODEL?.trim() || undefined,
    },
    tavilyApiKey: env.TAVILY_API_KEY?.trim() || undefined,
  };
}

/** A copy of the config with secrets masked, safe to log at startup. */
export function redactConfig(cfg: AppConfig): AppConfig {
  return {
    ...cfg,
    croo: { ...cfg.croo, sdkKey: mask(cfg.croo.sdkKey) },
    llm: { ...cfg.llm, token: cfg.llm.token ? '***' : undefined },
    tavilyApiKey: cfg.tavilyApiKey ? '***' : undefined,
  };
}

function mask(secret: string): string {
  return secret.length <= 8 ? '***' : `${secret.slice(0, 7)}…`;
}

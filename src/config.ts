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
 * Trim whitespace and strip a single pair of surrounding quotes. Node's
 * `--env-file` strips quotes but Docker's `--env-file` does not, so values can
 * arrive wrapped in literal quotes; normalize both cases here.
 */
function clean(v: string | undefined): string | undefined {
  if (v == null) return undefined;
  let s = v.trim();
  if (s.length >= 2 && ((s[0] === '"' && s.endsWith('"')) || (s[0] === "'" && s.endsWith("'")))) {
    s = s.slice(1, -1).trim();
  }
  return s === '' ? undefined : s;
}

/**
 * Load and validate configuration from the environment. Pure function over the
 * passed env map so it is unit-testable. Throws {@link MissingEnvError} listing
 * every absent required variable (not just the first).
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const missing = REQUIRED.filter((k) => !clean(env[k]));
  if (missing.length > 0) throw new MissingEnvError(missing);

  const authToken = clean(env.ANTHROPIC_AUTH_TOKEN);
  const apiKey = clean(env.ANTHROPIC_API_KEY);

  return {
    croo: {
      apiURL: clean(env.CROO_API_URL)!,
      wsURL: clean(env.CROO_WS_URL)!,
      sdkKey: clean(env.CROO_SDK_KEY)!,
      rpcURL: clean(env.BASE_RPC_URL),
    },
    serviceIds: {
      factcheck: clean(env.SVC_FACTCHECK_ID),
      schema: clean(env.SVC_SCHEMA_ID),
      grounding: clean(env.SVC_GROUNDING_ID),
    },
    dbPath: clean(env.DB_PATH) || './data/verigate.db',
    llm: {
      token: authToken || apiKey || undefined,
      useAuthToken: !!authToken,
      baseURL: clean(env.ANTHROPIC_BASE_URL),
      model: clean(env.ANTHROPIC_MODEL),
    },
    tavilyApiKey: clean(env.TAVILY_API_KEY),
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

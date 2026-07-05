import { describe, it, expect } from 'vitest';
import { loadConfig, redactConfig } from './config.js';
import { MissingEnvError } from './errors.js';

const fullEnv = {
  CROO_API_URL: 'https://api.croo.network',
  CROO_WS_URL: 'wss://api.croo.network/ws',
  CROO_SDK_KEY: 'croo_sk_abcdef1234567890',
  SVC_SCHEMA_ID: 'svc-schema',
  SVC_GROUNDING_ID: 'svc-grounding',
  SVC_FACTCHECK_ID: 'svc-factcheck',
} as NodeJS.ProcessEnv;

describe('loadConfig', () => {
  it('loads a complete environment and applies defaults for optional values', () => {
    const cfg = loadConfig(fullEnv);
    expect(cfg.croo.apiURL).toBe('https://api.croo.network');
    expect(cfg.croo.sdkKey).toBe('croo_sk_abcdef1234567890');
    expect(cfg.croo.rpcURL).toBeUndefined();
    expect(cfg.dbPath).toBe('./data/verigate.db');
    expect(cfg.serviceIds.schema).toBe('svc-schema');
  });

  it('honors overrides for optional values', () => {
    const cfg = loadConfig({ ...fullEnv, BASE_RPC_URL: 'https://rpc.example', DB_PATH: '/tmp/x.db' });
    expect(cfg.croo.rpcURL).toBe('https://rpc.example');
    expect(cfg.dbPath).toBe('/tmp/x.db');
  });

  it('throws MissingEnvError naming every absent required var', () => {
    const { CROO_SDK_KEY, CROO_WS_URL, ...partial } = fullEnv as Record<string, string>;
    try {
      loadConfig(partial as NodeJS.ProcessEnv);
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(MissingEnvError);
      expect((err as MissingEnvError).missing).toEqual(['CROO_WS_URL', 'CROO_SDK_KEY']);
    }
  });

  it('treats blank strings as missing', () => {
    expect(() => loadConfig({ ...fullEnv, CROO_SDK_KEY: '   ' })).toThrow(MissingEnvError);
  });

  it('strips surrounding quotes (Docker --env-file leaves them literal)', () => {
    const cfg = loadConfig({
      CROO_API_URL: '"https://api.croo.network"',
      CROO_WS_URL: "'wss://api.croo.network/ws'",
      CROO_SDK_KEY: '"croo_sk_abc"',
      SVC_SCHEMA_ID: '"217e16a8"',
    } as NodeJS.ProcessEnv);
    expect(cfg.croo.apiURL).toBe('https://api.croo.network');
    expect(cfg.croo.wsURL).toBe('wss://api.croo.network/ws');
    expect(cfg.croo.sdkKey).toBe('croo_sk_abc');
    expect(cfg.serviceIds.schema).toBe('217e16a8');
  });

  it('treats a quoted-empty value as missing', () => {
    expect(() => loadConfig({ ...fullEnv, CROO_SDK_KEY: '""' })).toThrow(MissingEnvError);
  });
});

describe('llm config', () => {
  it('reads a direct Anthropic api key (x-api-key mode)', () => {
    const cfg = loadConfig({ ...fullEnv, ANTHROPIC_API_KEY: 'sk-ant-123' });
    expect(cfg.llm.token).toBe('sk-ant-123');
    expect(cfg.llm.useAuthToken).toBe(false);
    expect(cfg.llm.baseURL).toBeUndefined();
  });

  it('reads a gateway auth token with base URL and model', () => {
    const cfg = loadConfig({
      ...fullEnv,
      ANTHROPIC_AUTH_TOKEN: 'mnfst__x',
      ANTHROPIC_BASE_URL: 'https://app.manifest.build',
      ANTHROPIC_MODEL: 'auto',
    });
    expect(cfg.llm.token).toBe('mnfst__x');
    expect(cfg.llm.useAuthToken).toBe(true);
    expect(cfg.llm.baseURL).toBe('https://app.manifest.build');
    expect(cfg.llm.model).toBe('auto');
  });
});

describe('redactConfig', () => {
  it('masks the SDK key and LLM/search secrets', () => {
    const cfg = loadConfig({ ...fullEnv, ANTHROPIC_AUTH_TOKEN: 'mnfst__x', TAVILY_API_KEY: 'tvly-1' });
    const red = redactConfig(cfg);
    expect(red.croo.sdkKey).toBe('croo_sk…');
    expect(red.llm.token).toBe('***');
    expect(red.tavilyApiKey).toBe('***');
  });
});

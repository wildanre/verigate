import Anthropic from '@anthropic-ai/sdk';
import { TransientError } from '../errors.js';

/** JSON-completion abstraction so verifiers can be unit-tested with a mock. */
export interface LLM {
  completeJSON<T>(opts: { system: string; user: string; maxTokens?: number }): Promise<T>;
}

export const DEFAULT_MODEL = 'claude-sonnet-4-6';

export class AnthropicLLM implements LLM {
  constructor(
    private client: Anthropic,
    private model: string = DEFAULT_MODEL,
  ) {}

  async completeJSON<T>({ system, user, maxTokens = 1024 }: { system: string; user: string; maxTokens?: number }): Promise<T> {
    let msg;
    try {
      msg = await this.client.messages.create({
        model: this.model,
        max_tokens: maxTokens,
        temperature: 0,
        system: `${system}\n\nRespond with ONLY a JSON object, no prose or code fences.`,
        messages: [{ role: 'user', content: user }],
      });
    } catch (e) {
      throw new TransientError('LLM request failed', e);
    }
    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');
    return parseJSON<T>(text);
  }
}

/** Parse a JSON object from model text, tolerating code fences and surrounding prose. */
export function parseJSON<T>(text: string): T {
  const cleaned = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  const candidate = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  try {
    return JSON.parse(candidate) as T;
  } catch {
    throw new TransientError('LLM did not return valid JSON');
  }
}

export interface LLMClientOptions {
  token: string;
  /** True for a gateway bearer token (Authorization header); false for an Anthropic x-api-key. */
  useAuthToken?: boolean;
  baseURL?: string;
  model?: string;
}

export function createLLM(opts: LLMClientOptions): AnthropicLLM {
  const clientOpts: ConstructorParameters<typeof Anthropic>[0] = {};
  if (opts.baseURL) clientOpts.baseURL = opts.baseURL;
  if (opts.useAuthToken) clientOpts.authToken = opts.token;
  else clientOpts.apiKey = opts.token;
  return new AnthropicLLM(new Anthropic(clientOpts), opts.model ?? DEFAULT_MODEL);
}

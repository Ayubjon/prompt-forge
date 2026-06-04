import { describe, it, expect } from 'vitest';
import { parseConfig } from '../src/config.js';

describe('parseConfig', () => {
  it('returns config with defaults when only the key is set', () => {
    const c = parseConfig({ PROMPTFORGE_API_KEY: 'k' } as any);
    expect(c).toEqual({ apiKey: 'k', baseURL: 'https://api.openai.com/v1', model: 'gpt-4o-mini' });
  });

  it('falls back to OPENAI_API_KEY', () => {
    expect(parseConfig({ OPENAI_API_KEY: 'k2' } as any).apiKey).toBe('k2');
  });

  it('honors custom baseURL and model', () => {
    const c = parseConfig({
      PROMPTFORGE_API_KEY: 'k',
      PROMPTFORGE_BASE_URL: 'http://localhost:11434/v1',
      PROMPTFORGE_MODEL: 'llama3.1',
    } as any);
    expect(c.baseURL).toBe('http://localhost:11434/v1');
    expect(c.model).toBe('llama3.1');
  });

  it('throws when no key is set', () => {
    expect(() => parseConfig({} as any)).toThrow(/API key/);
  });
});

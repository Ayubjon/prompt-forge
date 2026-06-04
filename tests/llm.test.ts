import { describe, it, expect } from 'vitest';
import { createLLM } from '../src/llm.js';

describe('createLLM', () => {
  it('returns an object with a chat function (no network at construction)', () => {
    const llm = createLLM({ apiKey: 'x', baseURL: 'https://api.openai.com/v1', model: 'gpt-4o-mini' });
    expect(typeof llm.chat).toBe('function');
  });
});

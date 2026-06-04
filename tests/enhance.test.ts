import { describe, it, expect } from 'vitest';
import { buildEnhanceMessages, runEnhance } from '../src/enhance.js';

describe('buildEnhanceMessages', () => {
  it('puts target guidance in the system message and the draft in the user message', () => {
    const m = buildEnhanceMessages('make a logo', 'image');
    expect(m[0].role).toBe('system');
    expect(m[0].content.toLowerCase()).toMatch(/composition/);
    expect(m[1].role).toBe('user');
    expect(m[1].content).toContain('make a logo');
  });

  it('includes context when provided', () => {
    const m = buildEnhanceMessages('do x', 'general', 'for beginners');
    expect(m[1].content).toContain('for beginners');
  });
});

describe('runEnhance', () => {
  it('passes built messages to the llm and returns its output', async () => {
    let received: any;
    const fakeLLM = { chat: async (msgs: any) => { received = msgs; return 'IMPROVED'; } };
    const out = await runEnhance(fakeLLM, { draft: 'hi', target: 'general' });
    expect(out).toBe('IMPROVED');
    expect(received[1].content).toContain('hi');
  });
});

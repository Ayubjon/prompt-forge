import { describe, it, expect } from 'vitest';
import { buildCritiqueMessages, runCritique } from '../src/critique.js';

describe('buildCritiqueMessages', () => {
  it('asks for weaknesses and clarifying questions, and includes the draft', () => {
    const m = buildCritiqueMessages('write a blog post', 'writing');
    expect(m[0].content.toLowerCase()).toMatch(/clarifying question/);
    expect(m[1].content).toContain('write a blog post');
  });
});

describe('runCritique', () => {
  it('passes built messages to the llm and returns its output', async () => {
    let received: any;
    const fakeLLM = { chat: async (msgs: any) => { received = msgs; return 'CRITIQUE'; } };
    const out = await runCritique(fakeLLM, { draft: 'hi', target: 'general' });
    expect(out).toBe('CRITIQUE');
    expect(received[1].content).toContain('hi');
  });
});

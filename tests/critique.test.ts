import { describe, it, expect } from 'vitest';
import { buildCritiqueInstruction } from '../src/critique.js';

describe('buildCritiqueInstruction', () => {
  it('asks for weaknesses and clarifying questions and includes the draft', () => {
    const out = buildCritiqueInstruction('write a blog post', 'writing');
    expect(out.toLowerCase()).toMatch(/clarifying question/);
    expect(out).toContain('write a blog post');
  });
});

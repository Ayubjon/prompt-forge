import { describe, it, expect } from 'vitest';
import { buildEnhanceInstruction } from '../src/enhance.js';

describe('buildEnhanceInstruction', () => {
  it('asks to rewrite, includes target guidance and the draft', () => {
    const out = buildEnhanceInstruction('make a logo', 'image');
    expect(out.toLowerCase()).toMatch(/rewrite/);
    expect(out.toLowerCase()).toMatch(/composition/);
    expect(out).toContain('make a logo');
  });

  it('includes context when provided', () => {
    expect(buildEnhanceInstruction('do x', 'general', 'for beginners')).toContain('for beginners');
  });
});

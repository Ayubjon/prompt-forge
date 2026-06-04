import { describe, it, expect } from 'vitest';
import { TARGETS, targetGuidance } from '../src/targets.js';

describe('targets', () => {
  it('exposes the five targets', () => {
    expect(TARGETS).toEqual(['general', 'coding', 'image', 'writing', 'research']);
  });

  it('returns non-empty, distinct guidance per target', () => {
    const all = TARGETS.map(targetGuidance);
    all.forEach((g) => expect(g.length).toBeGreaterThan(20));
    expect(new Set(all).size).toBe(TARGETS.length);
  });

  it('image guidance mentions composition and lighting', () => {
    expect(targetGuidance('image').toLowerCase()).toMatch(/composition/);
    expect(targetGuidance('image').toLowerCase()).toMatch(/lighting/);
  });
});

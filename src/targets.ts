// Per-task prompt-engineering guidance. Pure, no I/O — the core expertise.

export type Target = 'general' | 'coding' | 'image' | 'writing' | 'research';

export const TARGETS: Target[] = ['general', 'coding', 'image', 'writing', 'research'];

const GUIDANCE: Record<Target, string> = {
  general:
    'Produce a clear, specific prompt: state the role/persona, the task, the necessary context, explicit constraints, and the desired output format.',
  coding:
    'Produce a coding prompt: name the language/framework and versions, the exact task, inputs and expected outputs, constraints (style, performance, edge cases), and request tests where appropriate.',
  image:
    'Produce a vivid image-generation prompt covering subject, composition, style or medium, lighting, color palette, mood, camera/lens, and quality modifiers.',
  writing:
    'Produce a writing prompt that specifies the audience, tone and voice, format, length, key points to cover, and anything to avoid.',
  research:
    'Produce a research prompt that states the precise question, scope and recency, depth, credible-source expectations, and a structured output (e.g., comparison or pros/cons with citations).',
};

export function targetGuidance(target: Target): string {
  return GUIDANCE[target];
}

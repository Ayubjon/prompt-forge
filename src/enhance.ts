// enhance_prompt: turn a rough draft into an expert, task-tailored prompt.

import { targetGuidance, type Target } from './targets.js';
import type { ChatMessage, LLM } from './llm.js';

export function buildEnhanceMessages(
  draft: string,
  target: Target,
  context?: string
): ChatMessage[] {
  const system =
    "You are an expert prompt engineer. Rewrite the user's DRAFT into an excellent, ready-to-use prompt. " +
    targetGuidance(target) +
    " Preserve the user's intent. Output the improved prompt, then a short \"Notes:\" section (1-3 bullets) listing key additions or assumptions.";
  const parts = [`DRAFT:\n${draft}`];
  if (context) parts.push(`ADDITIONAL CONTEXT:\n${context}`);
  return [
    { role: 'system', content: system },
    { role: 'user', content: parts.join('\n\n') },
  ];
}

export async function runEnhance(
  llm: LLM,
  args: { draft: string; target: Target; context?: string }
): Promise<string> {
  return llm.chat(buildEnhanceMessages(args.draft, args.target, args.context));
}

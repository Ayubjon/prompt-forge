// enhance_prompt: returns an instruction for the HOST model to act on.
// No LLM call here — the host (Claude Desktop, Cursor, ...) does the rewriting.

import { targetGuidance, type Target } from './targets.js';

export function buildEnhanceInstruction(draft: string, target: Target, context?: string): string {
  const lines = [
    'You are an expert prompt engineer. Rewrite the DRAFT below into an excellent, ready-to-use prompt.',
    `Guidance for this task: ${targetGuidance(target)}`,
    'Preserve the user\'s intent. Output the improved prompt, then a short "Notes:" section (1-3 bullets) with key additions or assumptions.',
    '',
    `DRAFT:\n${draft}`,
  ];
  if (context) lines.push('', `ADDITIONAL CONTEXT:\n${context}`);
  return lines.join('\n');
}

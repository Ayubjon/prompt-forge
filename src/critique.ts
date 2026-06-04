// critique_prompt: returns an instruction for the HOST model to act on.
// No LLM call here — the host model produces the critique.

import { targetGuidance, type Target } from './targets.js';

export function buildCritiqueInstruction(draft: string, target: Target): string {
  return [
    'You are an expert prompt engineer. Critique the DRAFT prompt below for the stated task.',
    `Guidance for this task: ${targetGuidance(target)}`,
    'List its main weaknesses, what important information is missing, and 2-4 specific clarifying questions to ask the user. Be concise and actionable. Do NOT rewrite the prompt.',
    '',
    `DRAFT:\n${draft}`,
  ].join('\n');
}

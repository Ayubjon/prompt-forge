// critique_prompt: point out weaknesses and ask clarifying questions.

import { targetGuidance, type Target } from './targets.js';
import type { ChatMessage, LLM } from './llm.js';

export function buildCritiqueMessages(draft: string, target: Target): ChatMessage[] {
  const system =
    "You are an expert prompt engineer. Critique the user's DRAFT prompt for the stated target. " +
    targetGuidance(target) +
    ' List its main weaknesses, what important information is missing, and 2-4 specific clarifying questions to ask the user. Be concise and actionable. Do NOT rewrite the prompt.';
  return [
    { role: 'system', content: system },
    { role: 'user', content: `DRAFT:\n${draft}` },
  ];
}

export async function runCritique(
  llm: LLM,
  args: { draft: string; target: Target }
): Promise<string> {
  return llm.chat(buildCritiqueMessages(args.draft, args.target));
}

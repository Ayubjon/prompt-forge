#!/usr/bin/env node
// prompt-forge MCP server: registers the enhance/critique tools over stdio.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { parseConfig } from './config.js';
import { createLLM, type LLM } from './llm.js';
import { runEnhance } from './enhance.js';
import { runCritique } from './critique.js';

const targetSchema = z
  .enum(['general', 'coding', 'image', 'writing', 'research'])
  .default('general');

// Lazily build the LLM from env; returns an error message if not configured.
function getLLM(): { llm: LLM } | { error: string } {
  try {
    return { llm: createLLM(parseConfig(process.env)) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

function setupHelp(reason: string): string {
  return (
    `prompt-forge is not configured: ${reason}.\n\n` +
    'Set PROMPTFORGE_API_KEY (or OPENAI_API_KEY) in your MCP host config. ' +
    'Optional: PROMPTFORGE_BASE_URL (default https://api.openai.com/v1), ' +
    'PROMPTFORGE_MODEL (default gpt-4o-mini).'
  );
}

const server = new McpServer({ name: 'prompt-forge', version: '0.1.0' });

server.tool(
  'enhance_prompt',
  'Rewrite a rough prompt into an expert, task-tailored prompt.',
  {
    draft: z.string().min(1).describe('The rough prompt to improve'),
    target: targetSchema.describe('Task type the prompt is for'),
    context: z.string().optional().describe('Optional extra context'),
  },
  async ({ draft, target, context }) => {
    const got = getLLM();
    if ('error' in got) {
      return { content: [{ type: 'text' as const, text: setupHelp(got.error) }], isError: true };
    }
    try {
      const text = await runEnhance(got.llm, { draft, target, context });
      return { content: [{ type: 'text' as const, text }] };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { content: [{ type: 'text' as const, text: `LLM request failed: ${msg}` }], isError: true };
    }
  }
);

server.tool(
  'critique_prompt',
  'Critique a prompt and suggest clarifying questions to improve it.',
  {
    draft: z.string().min(1).describe('The prompt to critique'),
    target: targetSchema.describe('Task type the prompt is for'),
  },
  async ({ draft, target }) => {
    const got = getLLM();
    if ('error' in got) {
      return { content: [{ type: 'text' as const, text: setupHelp(got.error) }], isError: true };
    }
    try {
      const text = await runCritique(got.llm, { draft, target });
      return { content: [{ type: 'text' as const, text }] };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { content: [{ type: 'text' as const, text: `LLM request failed: ${msg}` }], isError: true };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);

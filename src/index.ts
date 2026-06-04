#!/usr/bin/env node
// prompt-forge MCP server: returns expert prompt-engineering guidance that the
// HOST model (Claude Desktop, Cursor, ...) uses to rewrite or critique a prompt.
// No API key and no external LLM — it uses the model you already have.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { buildEnhanceInstruction } from './enhance.js';
import { buildCritiqueInstruction } from './critique.js';

const targetSchema = z
  .enum(['general', 'coding', 'image', 'writing', 'research'])
  .default('general');

const server = new McpServer({ name: 'prompt-forge', version: '0.2.0' });

server.tool(
  'enhance_prompt',
  'Rewrite a rough prompt into an expert, task-tailored prompt.',
  {
    draft: z.string().min(1).describe('The rough prompt to improve'),
    target: targetSchema.describe('Task type the prompt is for'),
    context: z.string().optional().describe('Optional extra context'),
  },
  async ({ draft, target, context }) => ({
    content: [{ type: 'text' as const, text: buildEnhanceInstruction(draft, target, context) }],
  })
);

server.tool(
  'critique_prompt',
  'Critique a prompt and suggest clarifying questions to improve it.',
  {
    draft: z.string().min(1).describe('The prompt to critique'),
    target: targetSchema.describe('Task type the prompt is for'),
  },
  async ({ draft, target }) => ({
    content: [{ type: 'text' as const, text: buildCritiqueInstruction(draft, target) }],
  })
);

const transport = new StdioServerTransport();
await server.connect(transport);

# prompt-forge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A TypeScript MCP server (`prompt-forge`) exposing `enhance_prompt` and `critique_prompt` tools that turn rough prompts into expert, task-tailored prompts via a configurable OpenAI-compatible LLM (BYO key).

**Architecture:** Official MCP SDK over stdio. The network LLM call is isolated in `llm.ts`; pure logic (config parsing, per-task guidance, message building) lives in small modules unit-tested with a mocked LLM. The MCP wiring is verified by a smoke test that boots the built server through the SDK client and lists the tools.

**Tech Stack:** TypeScript (NodeNext ESM), `@modelcontextprotocol/sdk`, `openai`, `zod`, `vitest`, `tsc` build, `npx` distribution. Node 18+ (project uses Node 23).

**Conventions:** project root is `~/Desktop/prompt-forge` (already git-init'd, author = ayubjon). Commit messages in English, **no AI/co-author trailers**. Source-to-source imports use `.js` extensions (NodeNext); tests import the same `.js` specifiers (vitest resolves them to `.ts`).

**File map:**
- `package.json`, `tsconfig.json`, `.gitignore`
- `src/config.ts` — parse/validate env  [pure]
- `src/targets.ts` — per-task guidance presets  [pure]
- `src/llm.ts` — OpenAI-compatible client (network boundary)
- `src/enhance.ts` — `buildEnhanceMessages` [pure] + `runEnhance(llm, args)`
- `src/critique.ts` — `buildCritiqueMessages` [pure] + `runCritique(llm, args)`
- `src/index.ts` — MCP server wiring (tools, stdio)
- `scripts/smoke.mjs` — integration smoke test (lists tools, no key needed)
- `tests/*.test.ts` — vitest unit tests
- `README.md`, `LICENSE`

**Shared interfaces:**
- `ForgeConfig = { apiKey: string; baseURL: string; model: string }`
- `ChatMessage = { role: 'system'|'user'|'assistant'; content: string }`
- `LLM = { chat(messages: ChatMessage[]): Promise<string> }`
- `Target = 'general'|'coding'|'image'|'writing'|'research'`

---

### Task 1: Scaffold and tooling

**Files:** Create `package.json`, `tsconfig.json`, `.gitignore`

- [ ] **Step 1: Initialize and install dependencies**

Run:
```bash
npm init -y
npm install @modelcontextprotocol/sdk openai zod
npm install -D typescript vitest @types/node
```
Expected: `node_modules/` created, deps in `package.json`.

- [ ] **Step 2: Set package.json fields**

Run:
```bash
npm pkg set type="module"
npm pkg set version="0.1.0"
npm pkg set description="MCP server that forges rough prompts into expert, task-tailored prompts"
npm pkg set bin.prompt-forge="dist/index.js"
npm pkg set files[0]="dist"
npm pkg set scripts.build="tsc"
npm pkg set scripts.test="vitest run"
npm pkg set scripts.prepare="tsc"
npm pkg set scripts.smoke="npm run build && node scripts/smoke.mjs"
```
Expected: no errors.

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": false
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Create `.gitignore`**

```gitignore
node_modules/
dist/
*.log
.DS_Store
```

- [ ] **Step 5: Verify toolchain**

Run: `npx tsc --version && npx vitest --version`
Expected: prints both versions, no error.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tsconfig.json .gitignore
git commit -m "chore: scaffold TypeScript MCP project"
```

---

### Task 2: config.ts (TDD)

**Files:** Create `src/config.ts`, `tests/config.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/config.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { parseConfig } from '../src/config.js';

describe('parseConfig', () => {
  it('returns config with defaults when only the key is set', () => {
    const c = parseConfig({ PROMPTFORGE_API_KEY: 'k' } as any);
    expect(c).toEqual({ apiKey: 'k', baseURL: 'https://api.openai.com/v1', model: 'gpt-4o-mini' });
  });

  it('falls back to OPENAI_API_KEY', () => {
    expect(parseConfig({ OPENAI_API_KEY: 'k2' } as any).apiKey).toBe('k2');
  });

  it('honors custom baseURL and model', () => {
    const c = parseConfig({
      PROMPTFORGE_API_KEY: 'k',
      PROMPTFORGE_BASE_URL: 'http://localhost:11434/v1',
      PROMPTFORGE_MODEL: 'llama3.1',
    } as any);
    expect(c.baseURL).toBe('http://localhost:11434/v1');
    expect(c.model).toBe('llama3.1');
  });

  it('throws when no key is set', () => {
    expect(() => parseConfig({} as any)).toThrow(/API key/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/config.test.ts`
Expected: FAIL — cannot resolve `../src/config.js`.

- [ ] **Step 3: Implement `src/config.ts`**

```ts
// Parse and validate configuration from environment variables. Pure function.

export interface ForgeConfig {
  apiKey: string;
  baseURL: string;
  model: string;
}

export function parseConfig(env: NodeJS.ProcessEnv): ForgeConfig {
  const apiKey = env.PROMPTFORGE_API_KEY || env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('missing API key — set PROMPTFORGE_API_KEY (or OPENAI_API_KEY)');
  }
  return {
    apiKey,
    baseURL: env.PROMPTFORGE_BASE_URL || 'https://api.openai.com/v1',
    model: env.PROMPTFORGE_MODEL || 'gpt-4o-mini',
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/config.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/config.ts tests/config.test.ts
git commit -m "feat: env config parsing"
```

---

### Task 3: targets.ts (TDD)

**Files:** Create `src/targets.ts`, `tests/targets.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/targets.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/targets.test.ts`
Expected: FAIL — cannot resolve `../src/targets.js`.

- [ ] **Step 3: Implement `src/targets.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/targets.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/targets.ts tests/targets.test.ts
git commit -m "feat: per-task prompt guidance presets"
```

---

### Task 4: llm.ts (OpenAI-compatible client)

**Files:** Create `src/llm.ts`, `tests/llm.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/llm.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { createLLM } from '../src/llm.js';

describe('createLLM', () => {
  it('returns an object with a chat function (no network at construction)', () => {
    const llm = createLLM({ apiKey: 'x', baseURL: 'https://api.openai.com/v1', model: 'gpt-4o-mini' });
    expect(typeof llm.chat).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/llm.test.ts`
Expected: FAIL — cannot resolve `../src/llm.js`.

- [ ] **Step 3: Implement `src/llm.ts`**

```ts
// OpenAI-compatible LLM client — the network boundary. BYO key.

import OpenAI from 'openai';
import type { ForgeConfig } from './config.js';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLM {
  chat(messages: ChatMessage[]): Promise<string>;
}

export function createLLM(config: ForgeConfig): LLM {
  const client = new OpenAI({ apiKey: config.apiKey, baseURL: config.baseURL });
  return {
    async chat(messages) {
      const resp = await client.chat.completions.create({
        model: config.model,
        messages,
        temperature: 0.7,
      });
      return (resp.choices[0]?.message?.content ?? '').trim();
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/llm.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/llm.ts tests/llm.test.ts
git commit -m "feat: OpenAI-compatible LLM client"
```

---

### Task 5: enhance.ts (TDD)

**Files:** Create `src/enhance.ts`, `tests/enhance.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/enhance.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { buildEnhanceMessages, runEnhance } from '../src/enhance.js';

describe('buildEnhanceMessages', () => {
  it('puts target guidance in the system message and the draft in the user message', () => {
    const m = buildEnhanceMessages('make a logo', 'image');
    expect(m[0].role).toBe('system');
    expect(m[0].content.toLowerCase()).toMatch(/composition/);
    expect(m[1].role).toBe('user');
    expect(m[1].content).toContain('make a logo');
  });

  it('includes context when provided', () => {
    const m = buildEnhanceMessages('do x', 'general', 'for beginners');
    expect(m[1].content).toContain('for beginners');
  });
});

describe('runEnhance', () => {
  it('passes built messages to the llm and returns its output', async () => {
    let received: any;
    const fakeLLM = { chat: async (msgs: any) => { received = msgs; return 'IMPROVED'; } };
    const out = await runEnhance(fakeLLM, { draft: 'hi', target: 'general' });
    expect(out).toBe('IMPROVED');
    expect(received[1].content).toContain('hi');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/enhance.test.ts`
Expected: FAIL — cannot resolve `../src/enhance.js`.

- [ ] **Step 3: Implement `src/enhance.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/enhance.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/enhance.ts tests/enhance.test.ts
git commit -m "feat: enhance_prompt logic"
```

---

### Task 6: critique.ts (TDD)

**Files:** Create `src/critique.ts`, `tests/critique.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/critique.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { buildCritiqueMessages, runCritique } from '../src/critique.js';

describe('buildCritiqueMessages', () => {
  it('asks for weaknesses and clarifying questions, and includes the draft', () => {
    const m = buildCritiqueMessages('write a blog post', 'writing');
    expect(m[0].content.toLowerCase()).toMatch(/clarifying question/);
    expect(m[1].content).toContain('write a blog post');
  });
});

describe('runCritique', () => {
  it('passes built messages to the llm and returns its output', async () => {
    let received: any;
    const fakeLLM = { chat: async (msgs: any) => { received = msgs; return 'CRITIQUE'; } };
    const out = await runCritique(fakeLLM, { draft: 'hi', target: 'general' });
    expect(out).toBe('CRITIQUE');
    expect(received[1].content).toContain('hi');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/critique.test.ts`
Expected: FAIL — cannot resolve `../src/critique.js`.

- [ ] **Step 3: Implement `src/critique.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/critique.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/critique.ts tests/critique.test.ts
git commit -m "feat: critique_prompt logic"
```

---

### Task 7: index.ts (MCP server wiring)

**Files:** Create `src/index.ts`

- [ ] **Step 1: Implement `src/index.ts`**

```ts
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
```

- [ ] **Step 2: Build and verify it compiles**

Run: `npm run build`
Expected: no TS errors; `dist/index.js` exists (`ls dist/index.js`).

- [ ] **Step 3: Commit**

```bash
git add src/index.ts
git commit -m "feat: MCP server wiring (enhance + critique over stdio)"
```

---

### Task 8: Smoke test (boots server, lists tools)

**Files:** Create `scripts/smoke.mjs`

- [ ] **Step 1: Create `scripts/smoke.mjs`**

```js
// Boots the built server and verifies the two tools are listed (no LLM call,
// so no API key is needed).
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({ command: 'node', args: ['dist/index.js'] });
const client = new Client({ name: 'smoke', version: '0.0.0' });
await client.connect(transport);
const { tools } = await client.listTools();
const names = tools.map((t) => t.name).sort();
await client.close();

const expected = ['critique_prompt', 'enhance_prompt'];
if (JSON.stringify(names) !== JSON.stringify(expected)) {
  console.error('FAIL: tools =', JSON.stringify(names));
  process.exit(1);
}
console.log('OK: tools =', JSON.stringify(names));
```

- [ ] **Step 2: Build and run the smoke test**

Run: `npm run build && node scripts/smoke.mjs`
Expected: `OK: tools = ["critique_prompt","enhance_prompt"]`

- [ ] **Step 3: Commit**

```bash
git add scripts/smoke.mjs
git commit -m "test: stdio smoke test listing the tools"
```

---

### Task 9: README and LICENSE

**Files:** Create `README.md`, `LICENSE`

- [ ] **Step 1: Create `README.md`**

````markdown
# prompt-forge

An MCP server that forges rough prompts into expert, task-tailored prompts —
right inside Claude Desktop, Cursor, or any MCP host. It uses your own
OpenAI-compatible LLM (bring your own key), so it works with OpenAI, OpenRouter,
Groq, or a free local model (Ollama / LM Studio).

## Tools

- **`enhance_prompt`** — rewrite a rough prompt into a polished, structured one.
  Args: `draft` (required), `target` (`general` | `coding` | `image` | `writing`
  | `research`), `context` (optional).
- **`critique_prompt`** — point out a prompt's weaknesses and ask clarifying
  questions. Args: `draft` (required), `target`.

## Install

Add to your MCP host config (e.g. Claude Desktop `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "prompt-forge": {
      "command": "npx",
      "args": ["-y", "github:Ayubjon/prompt-forge"],
      "env": { "PROMPTFORGE_API_KEY": "sk-your-key" }
    }
  }
}
```

### Free, local model (no API cost)

Run a local server (e.g. Ollama) and point prompt-forge at it:

```json
"env": {
  "PROMPTFORGE_API_KEY": "ollama",
  "PROMPTFORGE_BASE_URL": "http://localhost:11434/v1",
  "PROMPTFORGE_MODEL": "llama3.1"
}
```

## Configuration

| Env var | Required | Default |
|---|---|---|
| `PROMPTFORGE_API_KEY` | yes (or `OPENAI_API_KEY`) | — |
| `PROMPTFORGE_BASE_URL` | no | `https://api.openai.com/v1` |
| `PROMPTFORGE_MODEL` | no | `gpt-4o-mini` |

## Development

```bash
npm install
npm test          # unit tests (vitest)
npm run build     # compile to dist/
npm run smoke     # build + boot the server and list tools
```

## License

MIT
````

- [ ] **Step 2: Create `LICENSE` (MIT)**

```
MIT License

Copyright (c) 2026 Ayubjon

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 3: Commit**

```bash
git add README.md LICENSE
git commit -m "docs: README and MIT license"
```

---

### Task 10: Final verification

**Files:** none new.

- [ ] **Step 1: Run all unit tests**

Run: `npm test`
Expected: all suites PASS (config 4, targets 3, llm 1, enhance 3, critique 2 = 13 tests).

- [ ] **Step 2: Build + smoke**

Run: `npm run smoke`
Expected: `OK: tools = ["critique_prompt","enhance_prompt"]`

- [ ] **Step 3: Manual integration (performed by the user)**

1. Add the config snippet (Task 9) to Claude Desktop / Cursor with a real
   `PROMPTFORGE_API_KEY` (or a local Ollama setup).
2. Restart the host; confirm `prompt-forge` tools appear.
3. Ask the host: "use enhance_prompt to improve: 'make me a logo', target image" →
   verify a structured, improved prompt comes back.
4. Try `critique_prompt` on a vague prompt → verify weaknesses + clarifying questions.
5. Without a key set → verify the friendly setup message instead of a crash.

Expected: behavior matches the descriptions.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: adjustments from integration testing"
```
If no fixes were needed, no commit is necessary.

---

## Self-Review (done while writing the plan)

- **Spec coverage:** engine = own LLM via BYO key (Tasks 4, 7); OpenAI-compatible configurable (Tasks 2, 4 + README local-model example); tools enhance + critique with target presets (Tasks 3, 5, 6, 7); stdio MCP wiring (Task 7); config/error handling incl. missing-key friendly message (Tasks 2, 7); npx/GitHub distribution (Tasks 1, 9); unit tests with mocked LLM + smoke integration (Tasks 2–6, 8, 10). No gaps.
- **Placeholder scan:** none — every step has concrete code/commands. (`sk-your-key` / `YOUR...` are documented placeholders in README, not plan gaps.)
- **Type/name consistency:** `ForgeConfig`, `ChatMessage`, `LLM`, `Target`, `parseConfig`, `targetGuidance`, `buildEnhanceMessages`/`runEnhance`, `buildCritiqueMessages`/`runCritique`, tool names `enhance_prompt`/`critique_prompt`, env vars `PROMPTFORGE_*` — consistent across config/targets/llm/enhance/critique/index, tests, smoke, and README.

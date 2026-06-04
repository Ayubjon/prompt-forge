# Design: prompt-forge MCP server

**Date:** 2026-06-04
**Status:** approved, ready for the implementation plan

## Goal

An MCP server that plugs into any MCP host (Claude Desktop, Cursor, Claude Code)
and gives the agent tools that turn rough user prompts into expert,
task-tailored prompts — using a configurable OpenAI-compatible LLM (bring your
own key). The server's value is curated prompt-engineering expertise baked into
per-task system prompts.

Working name: `prompt-forge` (npm package `prompt-forge-mcp`; renameable).

## Engine decision

The server calls its own LLM (BYO key) — not the host model. Provider is
**OpenAI-compatible and configurable** (base URL + model + key), so it works
with OpenAI, OpenRouter, Groq, and local servers (Ollama / LM Studio). Local
models keep it free, which removes the cost barrier of the BYO-key approach.

## Tools (v1 — focused)

### `enhance_prompt`
- Input: `draft` (string, required), `target` (enum: `general` | `coding` |
  `image` | `writing` | `research`, default `general`), `context` (string, optional).
- Output: the improved prompt, followed by a short "Notes" section listing what
  was added or assumed.

### `critique_prompt`
- Input: `draft` (string, required), `target` (same enum, default `general`).
- Output: a critique — weaknesses, missing information, and 2–4 clarifying
  questions to ask the user (the "correct the user's prompt" behavior).

The per-`target` system prompts (the prompt-engineering know-how) live in
`targets.ts` and are the core asset.

## Architecture

- TypeScript, official MCP SDK (`@modelcontextprotocol/sdk`), **stdio** transport.
- LLM access via the `openai` SDK with a configurable `baseURL`.
- Input validation with `zod`.
- Distributed via `npx` (zero install for users); can run straight from GitHub
  (`npx github:Ayubjon/prompt-forge`) — npm publish optional/later.

## File structure

```
prompt-forge/
├── package.json          # deps: @modelcontextprotocol/sdk, openai, zod; bin -> dist/index.js
├── tsconfig.json
├── src/
│   ├── index.ts          # MCP server: register tools, connect stdio transport
│   ├── config.ts         # parse/validate env (key, baseURL, model)  [pure]
│   ├── llm.ts            # OpenAI-compatible client wrapper: chat(messages)
│   ├── targets.ts        # task presets -> system prompts  [pure, tested]
│   └── tools/
│       ├── enhance.ts    # buildMessages(...) [pure] + handler (llm injected)
│       └── critique.ts   # buildMessages(...) [pure] + handler (llm injected)
├── tests/                # vitest: config, targets, buildMessages, formatting (llm mocked)
├── README.md
└── LICENSE
```

**Testability:** the network LLM call is isolated in `llm.ts`. Pure logic
(config parsing, target presets, message building, response formatting) is
unit-tested with a mocked LLM — no network. The real LLM call and the MCP wiring
are verified manually/integration.

## Configuration (env, set in the MCP host config)

- `PROMPTFORGE_API_KEY` — required (falls back to `OPENAI_API_KEY`).
- `PROMPTFORGE_BASE_URL` — default `https://api.openai.com/v1`.
- `PROMPTFORGE_MODEL` — default `gpt-4o-mini`.

## Data flow

```
Host --enhance_prompt(draft,target)--> index.ts
  -> buildMessages(draft, target, context)   (targets.ts: per-task system prompt)
  -> llm.chat(messages)                       (llm.ts: OpenAI-compatible API, BYO key)
  -> format result (improved prompt + notes)
<-- text returned to the host
```

## Error handling

- Missing/invalid config → the tool returns a clear, actionable error with setup
  instructions (does not crash the server).
- LLM call failure (network/auth/rate limit) → caught, returns a readable message.
- Empty `draft` → zod validation error.

## Testing

- **Unit (vitest):** `parseConfig`, `targets` presets, `buildMessages` for both
  tools, and response formatting — with a mocked LLM, no network.
- **Manual integration:** register the server in Claude Desktop / Cursor with a
  real key (or local Ollama), call both tools, verify output.

## Star-worthiness

A README with a before/after GIF (rough prompt → forged prompt), one-line
install, and support for free local models (Ollama) so there's no cost barrier.
Distribution via posts on Hacker News / Reddit / X / Product Hunt.

## Out of scope (v1)

Interactive multi-step clarification loop, a prompt-template library, a web UI,
npm publishing (can come later; running from GitHub works immediately).

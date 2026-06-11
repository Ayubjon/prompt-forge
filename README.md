# prompt-forge

An MCP server that forges rough prompts into expert, task-tailored prompts —
right inside Claude Desktop, Cursor, or any MCP host. **No API key, no extra
model:** it hands your host's own model expert prompt-engineering guidance and
lets it do the rewriting.

## Tools

- **`enhance_prompt`** — rewrite a rough prompt into a polished, structured one.
  Args: `draft` (required), `target` (`general` | `coding` | `image` | `writing`
  | `research`), `context` (optional).
- **`critique_prompt`** — point out a prompt's weaknesses and ask clarifying
  questions. Args: `draft` (required), `target`.

## How it works

prompt-forge does not call any LLM itself. When a tool is invoked it returns a
self-contained instruction (expert guidance for the task + your draft); the host
model (e.g. Claude in Claude Desktop) reads that and produces the result. So
there is **nothing to configure** — it uses the model you already have.

## Install

Add to your MCP host config (e.g. Claude Desktop `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "prompt-forge": {
      "command": "npx",
      "args": ["-y", "github:Ayubjon/prompt-forge"]
    }
  }
}
```

No `env` block is needed. Restart the host, then ask it to use the
`enhance_prompt` or `critique_prompt` tool.

## Development

```bash
npm install
npm test          # unit tests (vitest)
npm run build     # compile to dist/
npm run smoke     # build + boot the server and list its tools
```

## License

MIT

## Support

If this project is useful to you, you can support its development with a crypto tip — thank you!

**USDT — Ethereum (ERC-20):**

`0xad39bdf2df0b8dd6991150fcea0a156150ed19b8`

[View / verify on Etherscan](https://etherscan.io/address/0xad39bdf2df0b8dd6991150fcea0a156150ed19b8)

> Send only on the **Ethereum (ERC-20)** network.

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
npm run smoke     # build + boot the server and list its tools
```

## License

MIT

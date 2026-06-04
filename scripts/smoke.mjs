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

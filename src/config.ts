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

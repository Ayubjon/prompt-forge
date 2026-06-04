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

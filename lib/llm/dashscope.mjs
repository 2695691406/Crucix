// DashScope Coding Plan Provider — OpenAI-compatible, raw fetch, no SDK
// Base URL: https://coding.dashscope.aliyuncs.com/v1
// API Key format: sk-sp-xxxxx (Coding Plan exclusive key)

import { LLMProvider } from './provider.mjs';

const DASHSCOPE_BASE_URL = 'https://coding.dashscope.aliyuncs.com/v1';

export class DashScopeProvider extends LLMProvider {
  constructor(config) {
    super(config);
    this.name = 'dashscope';
    this.apiKey = config.apiKey;
    this.model = config.model || 'qwen3.5-plus';
    this.baseUrl = (config.baseUrl || DASHSCOPE_BASE_URL).replace(/\/$/, '');
  }

  get isConfigured() { return !!this.apiKey; }

  async complete(systemPrompt, userMessage, opts = {}) {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: opts.maxTokens || 4096,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      }),
      signal: AbortSignal.timeout(opts.timeout || 60000),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`DashScope API ${res.status}: ${err.substring(0, 200)}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';

    return {
      text,
      usage: {
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
      },
      model: data.model || this.model,
    };
  }
}

export interface LlmConfig {
  id: string;
  name: string;
  provider: "gemini" | "openai" | "anthropic" | "deepseek" | "openrouter" | "groq" | "alibaba";
  apiKey: string;
  model: string;
  baseUrl?: string;
  isDefaultText: boolean;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export const LLM_PROVIDERS_META = {
  gemini: {
    value: 'gemini',
    label: 'Google Gemini',
    defaultModel: 'gemini-2.5-flash',
    defaultUrl: '',
  },
  openai: {
    value: 'openai',
    label: 'OpenAI GPT',
    defaultModel: 'gpt-4o-mini',
    defaultUrl: 'https://api.openai.com/v1/chat/completions',
  },
  anthropic: {
    value: 'anthropic',
    label: 'Anthropic Claude',
    defaultModel: 'claude-3-5-haiku-20241022',
    defaultUrl: 'https://api.anthropic.com/v1/messages',
  },
  deepseek: {
    value: 'deepseek',
    label: 'DeepSeek Chat (Ultra-Low Cost)',
    defaultModel: 'deepseek-chat',
    defaultUrl: 'https://api.deepseek.com/chat/completions',
  },
  openrouter: {
    value: 'openrouter',
    label: 'OpenRouter (Flexible / Free Models)',
    defaultModel: 'google/gemini-2.5-flash',
    defaultUrl: 'https://openrouter.ai/api/v1/chat/completions',
  },
  groq: {
    value: 'groq',
    label: 'Groq (Ultra-Fast / High Efficiency)',
    defaultModel: 'llama3-8b-8192',
    defaultUrl: 'https://api.groq.com/openai/v1/chat/completions',
  },
  alibaba: {
    value: 'alibaba',
    label: 'Alibaba Cloud Qwen (High Performance)',
    defaultModel: 'qwen-plus',
    defaultUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
  },
} as const;

export type LlmProviderType = keyof typeof LLM_PROVIDERS_META;

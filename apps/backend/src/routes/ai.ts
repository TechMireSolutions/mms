import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { generateCompletion } from '../services/llmService.js';
import { loadGlobalSettings } from '../services/globalSettingsService.js';
import { authenticateTenant } from '../middleware/authenticate.js';
import { sendForbidden } from '../lib/httpErrors.js';
import { parseRequest, replyValidationError } from '../lib/zodRequest.js';
import type { User } from '@mms/shared';

const modelsBodySchema = z.object({
  provider: z.string(),
  apiKey: z.string().optional(),
  configId: z.string().optional(),
  baseUrl: z.string().optional(),
});

const messageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
});

const testBodySchema = z.object({
  prompt: z.string().optional(),
  systemInstruction: z.string().optional(),
  configId: z.string().optional(),
  customConfig: z.object({
    id: z.string(),
    name: z.string(),
    provider: z.enum(['gemini', 'openai', 'anthropic', 'deepseek', 'openrouter', 'groq', 'alibaba']),
    apiKey: z.string(),
    model: z.string(),
    baseUrl: z.string().optional(),
    isDefaultText: z.boolean(),
    temperature: z.number().optional(),
    maxTokens: z.number().optional(),
    topP: z.number().optional(),
  }).optional(),
  messages: z.array(messageSchema).optional(),
});

interface GeminiModelsResponse {
  models?: Array<{ name: string }>;
}

interface AnthropicModelsResponse {
  data?: Array<{ id: string }>;
}

interface OpenAiModelsResponse {
  data?: Array<{ id: string }>;
}

export default async function aiRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  // Enforce authentication AND admin-only access for all AI configuration routes
  fastify.addHook('preHandler', async (request, reply) => {
    await authenticateTenant(request, reply);
    const user = request.user as User;
    if (user.role !== 'admin') {
      return sendForbidden(reply, 'Admin privilege required to access AI configuration API');
    }
  });

  fastify.post('/models', async (request, reply) => {
    const parsed = parseRequest(modelsBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    const { provider, apiKey, configId, baseUrl } = parsed.data;

    let resolvedApiKey = apiKey;
    if (!resolvedApiKey?.trim() && configId) {
      const settings = await loadGlobalSettings();
      const savedConfig = (settings.llmConfigs ?? []).find(c => c.id === configId);
      if (savedConfig) {
        resolvedApiKey = savedConfig.apiKey;
      }
    }

    if (!resolvedApiKey?.trim()) {
      return reply.send({ success: true, models: [] });
    }

    try {
      let models: string[] = [];

      if (provider === 'gemini') {
        const url = baseUrl?.trim()
          ? `${baseUrl.trim()}/models?key=${resolvedApiKey}`
          : `https://generativelanguage.googleapis.com/v1beta/models?key=${resolvedApiKey}`;
        const res = await fetch(url);
        if (res.ok) {
          const json = (await res.json()) as GeminiModelsResponse;
          models = (json.models || []).map((m) => m.name.replace('models/', ''));
        }
      } else if (provider === 'anthropic') {
        const url = baseUrl?.trim() || 'https://api.anthropic.com/v1/models';
        const res = await fetch(url, {
          headers: {
            'x-api-key': resolvedApiKey,
            'anthropic-version': '2023-06-01'
          }
        });
        if (res.ok) {
          const json = (await res.json()) as AnthropicModelsResponse;
          models = (json.data || []).map((m) => m.id);
        } else {
          models = ['claude-3-5-haiku-20241022', 'claude-3-5-sonnet-20241022', 'claude-3-opus-20240229'];
        }
      } else {
        const openAiCompatibleUrls = {
          openai: 'https://api.openai.com/v1/models',
          deepseek: 'https://api.deepseek.com/models',
          openrouter: 'https://openrouter.ai/api/v1/models',
          groq: 'https://api.groq.com/openai/v1/models',
          alibaba: 'https://dashscope.aliyuncs.com/compatible-mode/v1/models'
        };

        const defaultUrl = openAiCompatibleUrls[provider as keyof typeof openAiCompatibleUrls];
        if (defaultUrl || baseUrl?.trim()) {
          const url = baseUrl?.trim() ? `${baseUrl.trim()}/models` : defaultUrl;
          const headers: Record<string, string> = {
            'Authorization': `Bearer ${resolvedApiKey}`
          };
          if (provider === 'openrouter') {
            const domain = process.env.MMS_APP_DOMAIN?.trim();
            headers['HTTP-Referer'] = domain ? `https://${domain}` : 'http://localhost:3000';
            headers['X-Title'] = 'MMS';
          }
          const res = await fetch(url, { headers });
          if (res.ok) {
            const json = (await res.json()) as OpenAiModelsResponse;
            models = (json.data || []).map((m) => m.id);
          }
        }
      }

      const uniqueModels = Array.from(new Set(models)).sort();
      return reply.send({ success: true, models: uniqueModels });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      return reply.send({ success: false, message: errMsg, models: [] });
    }
  });

  fastify.post('/test', async (request, reply) => {
    const parsed = parseRequest(testBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    const { prompt, systemInstruction, configId, customConfig, messages } = parsed.data;

    if (!prompt?.trim() && (!messages || messages.length === 0)) {
      return reply.status(400).send({
        type: 'validation_error',
        message: 'Prompt or messages array is required to test AI configuration',
      });
    }

    try {
      const startTime = performance.now();
      const response = await generateCompletion(prompt || '', {
        systemInstruction,
        configId,
        customConfig,
        messages
      });
      const endTime = performance.now();
      const latencyMs = Math.round(endTime - startTime);
      const characterCount = response.length;
      const wordCount = response.split(/\s+/).filter(Boolean).length;

      return reply.send({
        success: true,
        response,
        metrics: {
          latencyMs,
          characterCount,
          wordCount,
        },
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to generate content';
      return reply.status(400).send({
        success: false,
        message: errMsg,
      });
    }
  });
}

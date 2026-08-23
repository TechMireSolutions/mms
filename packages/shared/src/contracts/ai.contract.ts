import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

export const aiContract = c.router({
  test: {
    method: 'POST',
    path: '/api/ai/test',
    body: z.object({
      prompt: z.string(),
      configId: z.string().optional(),
      customConfig: z.any().optional(),
      systemInstruction: z.string().optional(),
      messages: z.array(z.any()).optional(),
    }),
    responses: {
      200: z.object({
        success: z.boolean(),
        response: z.string().optional(),
        message: z.string().optional(),
        metrics: z.any().optional(),
      }),
      400: z.any(),
      500: z.any(),
    },
    summary: 'Test LLM configuration connection',
  },
  models: {
    method: 'POST',
    path: '/api/ai/models',
    body: z.object({
      provider: z.string(),
      apiKey: z.string().optional(),
      configId: z.string().optional(),
      baseUrl: z.string().optional(),
    }),
    responses: {
      200: z.object({
        success: z.boolean(),
        models: z.array(z.string()).optional(),
      }),
      400: z.any(),
      500: z.any(),
    },
    summary: 'Fetch available models for LLM provider',
  },
});

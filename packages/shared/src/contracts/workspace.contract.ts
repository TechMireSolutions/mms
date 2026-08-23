import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

export const workspaceContract = c.router({
  bySubdomain: {
    method: 'GET',
    path: '/api/workspace/by-subdomain/:subdomain',
    pathParams: z.object({
      subdomain: z.string(),
    }),
    responses: {
      200: z.object({
        workspace: z.any(),
        branding: z.any().optional(),
      }),
      404: z.object({
        error: z.string(),
        code: z.string(),
      }),
    },
    summary: 'Lookup workspace by subdomain',
  },
  publicBranding: {
    method: 'GET',
    path: '/api/workspace/public-branding',
    responses: {
      200: z.object({
        branding: z.any().optional(),
      }),
      404: z.object({
        error: z.string(),
        code: z.string(),
      }),
    },
    summary: 'Get public branding for current workspace',
  },
  registry: {
    method: 'GET',
    path: '/api/workspace/registry',
    responses: {
      200: z.any(),
      401: z.any(),
      403: z.any(),
    },
    summary: 'Get apex workspace registry (apex-only)',
  },
});

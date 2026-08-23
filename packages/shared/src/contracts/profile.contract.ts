import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { ownContactPatchBodySchema } from '../schemas/profile.dto.js';

const c = initContract();

export const profileContract = c.router({
  getProfile: {
    method: 'GET',
    path: '/api/auth/profile',
    responses: {
      200: z.object({
        profile: z.any(),
      }),
      401: z.any(),
    },
    summary: 'Get current user profile',
  },
  updateContact: {
    method: 'PUT',
    path: '/api/auth/me/contact',
    body: ownContactPatchBodySchema,
    responses: {
      200: z.object({
        success: z.boolean(),
        contact: z.any().optional(),
      }),
      400: z.any(),
      401: z.any(),
      403: z.any(),
    },
    summary: 'Update own contact profile',
  },
});

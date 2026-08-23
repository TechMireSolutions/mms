import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

export const authContract = c.router({
  changePassword: {
    method: 'POST',
    path: '/api/auth/change-password',
    body: z.object({
      currentPassword: z.string(),
      newPassword: z.string(),
    }),
    responses: {
      200: z.object({
        success: z.boolean(),
        requiresSignIn: z.boolean().optional(),
      }),
      400: z.any(),
      401: z.any(),
      403: z.any(),
    },
    summary: 'Change user password',
  },
  requestLoginEmail: {
    method: 'POST',
    path: '/api/auth/login-email/request',
    body: z.object({
      newLoginEmail: z.string(),
      currentPassword: z.string(),
    }),
    responses: {
      200: z.object({
        challengeId: z.string(),
        devCode: z.string().optional(),
      }),
      400: z.any(),
      401: z.any(),
      403: z.any(),
    },
    summary: 'Request login email change',
  },
  confirmLoginEmail: {
    method: 'POST',
    path: '/api/auth/login-email/confirm',
    body: z.object({
      challengeId: z.string(),
      code: z.string(),
    }),
    responses: {
      200: z.object({
        success: z.boolean(),
      }),
      400: z.any(),
      401: z.any(),
      403: z.any(),
    },
    summary: 'Confirm login email change',
  },
});

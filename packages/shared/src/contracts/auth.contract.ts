import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  changePasswordBodySchema,
  requestLoginEmailChangeBodySchema,
  confirmLoginEmailChangeBodySchema,
} from '../schemas/profile.dto.js';

const c = initContract();

export const authContract = c.router({
  institutionSetupStatus: {
    method: 'GET',
    path: '/api/auth/institution-setup-status',
    responses: {
      200: z.object({ complete: z.boolean() }),
      401: z.unknown(),
      403: z.unknown(),
    },
    summary: 'Get workspace institution setup completion status',
  },
  changePassword: {
    method: 'POST',
    path: '/api/auth/change-password',
    body: changePasswordBodySchema,
    responses: {
      200: z.object({
        success: z.boolean(),
        requiresSignIn: z.boolean().optional(),
      }),
      400: z.unknown(),
      401: z.unknown(),
      403: z.unknown(),
    },
    summary: 'Change user password',
  },
  requestLoginEmail: {
    method: 'POST',
    path: '/api/auth/login-email/request',
    body: requestLoginEmailChangeBodySchema,
    responses: {
      200: z.object({
        challengeId: z.string(),
        devCode: z.string().optional(),
      }),
      400: z.unknown(),
      401: z.unknown(),
      403: z.unknown(),
    },
    summary: 'Request login email change',
  },
  confirmLoginEmail: {
    method: 'POST',
    path: '/api/auth/login-email/confirm',
    body: confirmLoginEmailChangeBodySchema,
    responses: {
      200: z.object({
        success: z.boolean(),
      }),
      400: z.unknown(),
      401: z.unknown(),
      403: z.unknown(),
    },
    summary: 'Confirm login email change',
  },
});


import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { dashboardPreferencesPutBodySchema } from '../dashboardPreferencesTypes.js';
import { dashboardWidgetsPutBodySchema } from '../dashboardWidgetSchema.js';

const c = initContract();

const errorResponse = z.unknown();
const ok = z.unknown();

export const dashboardContract = c.router({
  getPreferences: {
    method: 'GET',
    path: '/api/dashboard/preferences',
    responses: {
      200: ok,
      403: errorResponse,
      500: errorResponse,
    },
    summary: 'Get dashboard preferences',
  },
  putPreferences: {
    method: 'PUT',
    path: '/api/dashboard/preferences',
    body: dashboardPreferencesPutBodySchema,
    responses: {
      200: ok,
      400: errorResponse,
      403: errorResponse,
      500: errorResponse,
    },
    summary: 'Update dashboard preferences',
  },
  getWidgets: {
    method: 'GET',
    path: '/api/dashboard/widgets',
    responses: {
      200: ok,
      403: errorResponse,
      500: errorResponse,
    },
    summary: 'Get dashboard widgets',
  },
  putWidgets: {
    method: 'PUT',
    path: '/api/dashboard/widgets',
    body: dashboardWidgetsPutBodySchema,
    responses: {
      200: ok,
      400: errorResponse,
      403: errorResponse,
      500: errorResponse,
    },
    summary: 'Update dashboard widgets',
  },
  deleteWidget: {
    method: 'DELETE',
    path: '/api/dashboard/widgets/:id',
    body: z.any().optional(),
    responses: {
      200: ok,
      400: errorResponse,
      403: errorResponse,
      500: errorResponse,
    },
    summary: 'Delete a dashboard widget',
  },
  reorderWidgets: {
    method: 'PUT',
    path: '/api/dashboard/widgets/reorder',
    body: z.object({
      order: z.array(
        z.object({
          id: z.string().min(1),
          sortOrder: z.number(),
        }),
      ),
    }),
    responses: {
      200: ok,
      400: errorResponse,
      403: errorResponse,
      500: errorResponse,
    },
    summary: 'Reorder dashboard widgets',
  },
  getSummary: {
    method: 'GET',
    path: '/api/dashboard/summary',
    query: z
      .object({
        date: z.string().optional(),
        role: z.string().optional(),
      })
      .optional(),
    responses: {
      200: ok,
      403: errorResponse,
      500: errorResponse,
    },
    summary: 'Get composite tenant dashboard summary metrics',
  },
});



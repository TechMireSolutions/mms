import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { dashboardPreferencesPutBodySchema } from '../dashboardPreferencesTypes.js';
import { dashboardWidgetsPutBodySchema } from '../dashboardWidgetSchema.js';

const c = initContract();

export const dashboardContract = c.router({
  getPreferences: {
    method: 'GET',
    path: '/api/dashboard/preferences',
    responses: {
      200: z.object({
        preferences: z.any(),
      }),
    },
    summary: 'Get dashboard preferences',
  },
  putPreferences: {
    method: 'PUT',
    path: '/api/dashboard/preferences',
    body: dashboardPreferencesPutBodySchema,
    responses: {
      200: z.object({
        success: z.boolean(),
        preferences: z.any(),
      }),
    },
    summary: 'Update dashboard preferences',
  },
  getWidgets: {
    method: 'GET',
    path: '/api/dashboard/widgets',
    responses: {
      200: z.object({
        widgets: z.any(),
      }),
    },
    summary: 'Get dashboard widgets',
  },
  putWidgets: {
    method: 'PUT',
    path: '/api/dashboard/widgets',
    body: dashboardWidgetsPutBodySchema,
    responses: {
      200: z.object({
        success: z.boolean(),
        widgets: z.any(),
      }),
    },
    summary: 'Update dashboard widgets',
  },
  deleteWidget: {
    method: 'DELETE',
    path: '/api/dashboard/widgets/:id',
    body: z.any(),
    responses: {
      200: z.object({
        success: z.boolean(),
      }),
    },
    summary: 'Delete a dashboard widget',
  },
});

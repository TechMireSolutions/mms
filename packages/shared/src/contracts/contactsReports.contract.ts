import { z } from 'zod';
import { baseListQuerySchema } from '../apiSchemas.js';

export const contactsReportAnalyticsQuerySchema = z.object({
  years: z
    .union([z.string(), z.array(z.number())])
    .optional()
    .transform((value) => {
      if (Array.isArray(value)) return value;
      return value
        ? value
            .split(',')
            .map((year) => Number.parseInt(year.trim(), 10))
            .filter((year) => Number.isFinite(year) && year >= 1900 && year <= 2100)
        : [];
    }),
  lang: z.string().max(16).optional(),
});

/** Reports, analytics, duplicates, and saved-report routes. */
export const contactsReportsRoutes = {
  reportAnalytics: {
    method: 'GET',
    path: '/api/contacts/report-analytics',
    query: contactsReportAnalyticsQuerySchema,
    responses: {
      200: z.unknown(),
      403: z.unknown(),
      500: z.unknown(),
    },
    summary: 'Get contact report analytics',
  },
  getDuplicates: {
    method: 'GET',
    path: '/api/contacts/duplicates',
    query: baseListQuerySchema,
    responses: { 200: z.unknown(), 403: z.unknown(), 500: z.unknown() },
    summary: 'Get contact duplicates',
  },
  getSavedReports: {
    method: 'GET',
    path: '/api/contacts/saved-reports',
    responses: { 200: z.unknown(), 403: z.unknown(), 500: z.unknown() },
    summary: 'Get contact saved reports',
  },
  createSavedReport: {
    method: 'POST',
    path: '/api/contacts/saved-reports',
    body: z.unknown(),
    responses: { 200: z.unknown(), 400: z.unknown(), 500: z.unknown() },
    summary: 'Create contact saved report',
  },
  deleteSavedReport: {
    method: 'DELETE',
    path: '/api/contacts/saved-reports/:id',
    pathParams: z.object({ id: z.string() }),
    body: z.unknown(),
    responses: { 200: z.unknown(), 404: z.unknown(), 500: z.unknown() },
    summary: 'Delete contact saved report',
  },
  runSavedReport: {
    method: 'POST',
    path: '/api/contacts/saved-reports/:id/run',
    pathParams: z.object({ id: z.string() }),
    body: z.unknown(),
    responses: { 200: z.unknown(), 404: z.unknown(), 500: z.unknown() },
    summary: 'Run contact saved report',
  },
} as const;

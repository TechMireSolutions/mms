import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { baseListQuerySchema } from '../apiSchemas.js';

const c = initContract();
const errorResponse = z.unknown();

export const userContract = c.router({
  list: {
    method: 'GET',
    path: '/api/users',
    query: baseListQuerySchema,
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'List workspace users',
  },
  activity: {
    method: 'GET',
    path: '/api/users/activity',
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'List user activity logs',
  },
  activityBulkUpdate: {
    method: 'PUT',
    path: '/api/users/activity/bulk',
    body: z.any(),
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Bulk upsert activity logs',
  },
  exportAudit: {
    method: 'POST',
    path: '/api/users/export-audit',
    body: z.object({ count: z.number(), scope: z.string() }),
    responses: { 200: z.unknown(), 400: errorResponse, 403: errorResponse, 500: errorResponse },
    summary: 'Log export audit',
  },
  bulkUpdate: {
    method: 'PUT',
    path: '/api/users/bulk',
    body: z.any(),
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Bulk upsert workspace users',
  },
  bulkDelete: {
    method: 'POST',
    path: '/api/users/bulk-delete',
    body: z.object({ ids: z.array(z.string()) }),
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Bulk soft-delete users',
  },
  bulkRestore: {
    method: 'POST',
    path: '/api/users/bulk-restore',
    body: z.object({ ids: z.array(z.string()) }),
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Bulk restore users',
  },
  delete: {
    method: 'DELETE',
    path: '/api/users/:id',
    body: z.any().optional(),
    responses: { 200: z.unknown(), 400: errorResponse, 403: errorResponse, 404: errorResponse, 500: errorResponse },
    summary: 'Soft delete a user',
  },
  restore: {
    method: 'POST',
    path: '/api/users/:id/restore',
    body: z.any().optional(),
    responses: { 200: z.unknown(), 403: errorResponse, 404: errorResponse, 500: errorResponse },
    summary: 'Restore a soft-deleted user',
  },
  getFieldConfig: {
    method: 'GET',
    path: '/api/users/config/fields',
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get field config',
  },
  updateFieldConfig: {
    method: 'PUT',
    path: '/api/users/config/fields',
    body: z.unknown(),
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Update field config',
  },
  getPreferences: {
    method: 'GET',
    path: '/api/users/config/preferences',
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get preferences',
  },
  updatePreferences: {
    method: 'PUT',
    path: '/api/users/config/preferences',
    body: z.unknown(),
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Update preferences',
  },
  getComposedConfig: {
    method: 'GET',
    path: '/api/users/config/composed',
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get composed config',
  },
});

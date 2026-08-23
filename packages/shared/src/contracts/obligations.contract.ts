import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { baseListQuerySchema } from '../apiSchemas.js';

const c = initContract();
const ok = z.unknown();

const bulkIds = z.object({ ids: z.array(z.string()), deletionReason: z.string().optional() });

export const obligationContract = c.router({
  listCollections: {
    method: 'GET',
    path: '/api/obligations/collections',
    query: baseListQuerySchema,
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'List obligation collections',
  },
  listTypes: {
    method: 'GET',
    path: '/api/obligations/types',
    query: z.object({}).optional(),
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'List obligation types',
  },
  listMujtahids: {
    method: 'GET',
    path: '/api/obligations/mujtahids',
    query: z.object({}).optional(),
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'List mujtahids',
  },
  listDistributions: {
    method: 'GET',
    path: '/api/obligations/distributions',
    query: z.object({}).optional(),
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'List obligation distributions',
  },
  listReps: {
    method: 'GET',
    path: '/api/obligations/reps',
    query: z.object({}).optional(),
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'List mujtahid reps',
  },
  listWakala: {
    method: 'GET',
    path: '/api/obligations/wakala',
    query: z.object({}).optional(),
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'List wakala types',
  },
  replaceTypes: {
    method: 'PUT',
    path: '/api/obligations/types/bulk',
    body: z.object({}).passthrough(),
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'Replace obligation types',
  },
  replaceMujtahids: {
    method: 'PUT',
    path: '/api/obligations/mujtahids/bulk',
    body: z.object({}).passthrough(),
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'Replace mujtahids',
  },
  replaceReps: {
    method: 'PUT',
    path: '/api/obligations/reps/bulk',
    body: z.object({}).passthrough(),
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'Replace mujtahid reps',
  },
  replaceWakala: {
    method: 'PUT',
    path: '/api/obligations/wakala/bulk',
    body: z.object({}).passthrough(),
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'Replace wakala types',
  },
  replaceDistributions: {
    method: 'PUT',
    path: '/api/obligations/distributions/bulk',
    body: z.object({}).passthrough(),
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'Replace distributions',
  },
  replaceCollections: {
    method: 'PUT',
    path: '/api/obligations/collections/bulk',
    body: z.object({}).passthrough(),
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'Replace collections',
  },
  deleteCollection: {
    method: 'DELETE',
    path: '/api/obligations/collections/:id',
    body: z.object({}).passthrough().optional(),
    responses: { 200: ok, 403: ok, 404: ok, 500: ok },
    summary: 'Delete obligation collection',
  },
  restoreCollection: {
    method: 'POST',
    path: '/api/obligations/collections/:id/restore',
    body: z.object({}).passthrough().optional(),
    responses: { 200: ok, 403: ok, 404: ok, 500: ok },
    summary: 'Restore obligation collection',
  },
  bulkDeleteCollections: {
    method: 'POST',
    path: '/api/obligations/collections/bulk-delete',
    body: bulkIds,
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'Bulk soft-delete obligation collections',
  },
  bulkRestoreCollections: {
    method: 'POST',
    path: '/api/obligations/collections/bulk-restore',
    body: bulkIds,
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'Bulk restore obligation collections',
  },
});

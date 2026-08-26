import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { baseListQuerySchema } from '../apiSchemas.js';

const c = initContract();
const ok = z.unknown();
const bulkIds = z.object({ ids: z.array(z.string()), deletionReason: z.string().optional() });

export const questionBankContract = c.router({
  listQuestions: {
    method: 'GET',
    path: '/api/question-bank/questions',
    query: baseListQuerySchema,
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'List questions',
  },
  bulkDeleteQuestions: {
    method: 'POST',
    path: '/api/question-bank/questions/bulk-delete',
    body: bulkIds,
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'Bulk soft-delete questions',
  },
  bulkRestoreQuestions: {
    method: 'POST',
    path: '/api/question-bank/questions/bulk-restore',
    body: bulkIds,
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'Bulk restore questions',
  },
  listTests: {
    method: 'GET',
    path: '/api/question-bank/tests',
    query: z.object({}).optional(),
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'List tests',
  },
  listResults: {
    method: 'GET',
    path: '/api/question-bank/assessment-results',
    query: z.object({}).optional(),
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'List assessment results',
  },
  bulkUpdateQuestions: {
    method: 'PUT',
    path: '/api/question-bank/questions/bulk',
    body: ok,
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'Bulk update questions',
  },
  bulkUpdateTests: {
    method: 'PUT',
    path: '/api/question-bank/tests/bulk',
    body: ok,
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'Bulk update tests',
  },
  bulkUpdateResults: {
    method: 'PUT',
    path: '/api/question-bank/assessment-results/bulk',
    body: ok,
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'Bulk update assessment results',
  },
  deleteQuestion: {
    method: 'DELETE',
    path: '/api/question-bank/questions/:id',
    body: ok,
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'Delete question',
  },
  restoreQuestion: {
    method: 'POST',
    path: '/api/question-bank/questions/:id/restore',
    body: ok,
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'Restore question',
  },
  widgetAggregates: {
    method: 'POST',
    path: '/api/question-bank/widget-aggregates',
    body: z.object({ widgets: z.array(z.unknown()) }),
    responses: { 200: z.unknown(), 403: z.unknown(), 500: z.unknown() },
    summary: 'Get widget aggregates',
  },
  getFieldConfig: {
    method: 'GET',
    path: '/api/question-bank/config/fields',
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'Get field config',
  },
  updateFieldConfig: {
    method: 'PUT',
    path: '/api/question-bank/config/fields',
    body: ok,
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'Update field config',
  },
  getPreferences: {
    method: 'GET',
    path: '/api/question-bank/config/preferences',
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'Get preferences',
  },
  updatePreferences: {
    method: 'PUT',
    path: '/api/question-bank/config/preferences',
    body: ok,
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'Update preferences',
  },
  getComposedConfig: {
    method: 'GET',
    path: '/api/question-bank/config/composed',
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'Get composed config',
  },
});

import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { baseListQuerySchema } from '../apiSchemas.js';

const c = initContract();
const errorResponse = z.unknown();
const ok = z.unknown();
const bulkIds = z.object({ ids: z.array(z.string()), deletionReason: z.string().optional() });

export const examinationContract = c.router({
  listExams: {
    method: 'GET',
    path: '/api/examinations/exams',
    query: baseListQuerySchema,
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'List exams',
  },
  bulkDeleteExams: {
    method: 'POST',
    path: '/api/examinations/exams/bulk-delete',
    body: bulkIds,
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'Bulk soft-delete exams',
  },
  bulkRestoreExams: {
    method: 'POST',
    path: '/api/examinations/exams/bulk-restore',
    body: bulkIds,
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'Bulk restore exams',
  },
  listResults: {
    method: 'GET',
    path: '/api/examinations/results',
    query: z.object({}).optional(),
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'List exam results',
  },
  bulkUpdateExams: {
    method: 'PUT',
    path: '/api/examinations/exams/bulk',
    body: ok,
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'Bulk upsert exams',
  },
  bulkUpdateResults: {
    method: 'PUT',
    path: '/api/examinations/results/bulk',
    body: ok,
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'Bulk upsert exam results',
  },
  deleteExam: {
    method: 'DELETE',
    path: '/api/examinations/exams/:id',
    body: ok,
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'Soft delete an exam',
  },
  restoreExam: {
    method: 'POST',
    path: '/api/examinations/exams/:id/restore',
    body: ok,
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'Restore a soft deleted exam',
  },

  getFieldConfig: {
    method: 'GET',
    path: '/api/examinations/field-config',
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get field config',
  },
  updateFieldConfig: {
    method: 'PUT',
    path: '/api/examinations/field-config',
    body: z.unknown(),
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Update field config',
  },
  getPreferences: {
    method: 'GET',
    path: '/api/examinations/preferences',
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get preferences',
  },
  updatePreferences: {
    method: 'PUT',
    path: '/api/examinations/preferences',
    body: z.unknown(),
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Update preferences',
  },
  getLookups: {
    method: 'GET',
    path: '/api/examinations/lookups',
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get all lookups',
  },
  getLookupKind: {
    method: 'GET',
    path: '/api/examinations/lookups/:kind',
    responses: { 200: z.unknown(), 403: errorResponse, 500: errorResponse },
    summary: 'Get a specific lookup kind',
  },
});

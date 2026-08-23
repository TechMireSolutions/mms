import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { baseListQuerySchema } from '../apiSchemas.js';

const c = initContract();
const ok = z.unknown();

export const messagingContract = c.router({
  listLogs: {
    method: 'GET',
    path: '/api/messaging/history',
    query: baseListQuerySchema,
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'List message logs',
  },
  listTemplates: {
    method: 'GET',
    path: '/api/messaging/templates',
    query: baseListQuerySchema,
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'List messaging templates',
  },
  listRecipients: {
    method: 'GET',
    path: '/api/messaging/recipients',
    query: baseListQuerySchema,
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'List message recipients',
  },
  getMetrics: {
    method: 'GET',
    path: '/api/messaging/metrics',
    query: z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }).optional(),
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'Get messaging analytics metrics',
  },
  saveTemplate: {
    method: 'POST',
    path: '/api/messaging/templates',
    body: ok,
    responses: { 200: ok, 201: ok, 400: ok, 403: ok, 500: ok },
    summary: 'Create or update a message template',
  },
  deleteTemplate: {
    method: 'DELETE',
    path: '/api/messaging/templates/:id',
    pathParams: z.object({ id: z.string() }),
    body: ok,
    responses: { 200: ok, 400: ok, 403: ok, 500: ok },
    summary: 'Delete a message template',
  },
  recordLogs: {
    method: 'POST',
    path: '/api/messaging/logs',
    body: ok,
    responses: { 200: ok, 201: ok, 400: ok, 403: ok, 500: ok },
    summary: 'Record message dispatch logs',
  },
  clearLogs: {
    method: 'DELETE',
    path: '/api/messaging/logs',
    body: ok,
    responses: { 200: ok, 400: ok, 403: ok, 500: ok },
    summary: 'Clear message logs',
  },
  resolveContacts: {
    method: 'POST',
    path: '/api/messaging/contacts/resolve',
    body: z.object({ ids: z.array(z.string()) }),
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'Resolve contacts by ids',
  },
  matchRecipients: {
    method: 'GET',
    path: '/api/messaging/recipients/match',
    query: z.object({}).passthrough(),
    responses: { 200: ok, 403: ok, 500: ok },
    summary: 'Match recipients',
  },
});

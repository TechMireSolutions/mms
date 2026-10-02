import { z } from 'zod';
import {
  facultyDesignationAssignmentSchema,
  facultyDesignationAssignmentWriteSchema,
  facultyDesignationSchema,
  facultyDesignationWriteSchema,
} from '../facultyDesignationTypes.js';

const errorResponse = z.unknown();

export const facultyDesignationContractEndpoints = {
  listDesignations: {
    method: 'GET' as const,
    path: '/api/faculty/designations',
    responses: { 200: z.object({ designations: z.array(facultyDesignationSchema) }), 403: errorResponse, 500: errorResponse },
    summary: 'List Faculty designation definitions',
  },
  saveDesignation: {
    method: 'PUT' as const,
    path: '/api/faculty/designations/:id',
    body: facultyDesignationWriteSchema,
    responses: { 200: z.object({ designation: facultyDesignationSchema }), 400: errorResponse, 403: errorResponse },
    summary: 'Create or update a Faculty designation definition',
  },
  deleteDesignation: {
    method: 'DELETE' as const,
    path: '/api/faculty/designations/:id',
    body: z.object({}).optional(),
    responses: {
      200: z.object({ success: z.literal(true) }),
      400: errorResponse,
      403: errorResponse,
      404: errorResponse,
      409: errorResponse,
      500: errorResponse,
    },
    summary: 'Soft-delete a Faculty designation definition',
  },
  listDesignationHistory: {
    method: 'GET' as const,
    path: '/api/faculty/:facultyId/designation-history',
    responses: { 200: z.object({ assignments: z.array(facultyDesignationAssignmentSchema) }), 403: errorResponse, 500: errorResponse },
    summary: 'List dated designation history for a Faculty member',
  },
  saveDesignationAssignment: {
    method: 'PUT' as const,
    path: '/api/faculty/:facultyId/designation-history/:assignmentId',
    body: facultyDesignationAssignmentWriteSchema,
    responses: { 200: z.object({ assignment: facultyDesignationAssignmentSchema }), 400: errorResponse, 403: errorResponse, 409: errorResponse },
    summary: 'Create or update a dated Faculty designation assignment',
  },
  deleteDesignationAssignment: {
    method: 'DELETE' as const,
    path: '/api/faculty/:facultyId/designation-history/:assignmentId',
    body: z.object({}).optional(),
    responses: {
      200: z.object({ success: z.literal(true) }),
      403: errorResponse,
      404: errorResponse,
      409: errorResponse,
      500: errorResponse,
    },
    summary: 'Delete a dated Faculty designation assignment (forbidden when it is the sole assignment for the member)',
  },
};

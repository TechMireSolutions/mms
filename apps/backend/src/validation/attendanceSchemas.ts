import { z } from 'zod';
import { attendanceRecordSchema } from '@mms/shared';
import { baseListQuerySchema } from './commonSchemas.js';

export const attendanceListQuerySchema = baseListQuerySchema.extend({
  classId: z.string().max(128).optional(),
  date: z.string().max(32).optional(),
  dateFrom: z.string().max(32).optional(),
  dateTo: z.string().max(32).optional(),
  status: z.string().max(200).optional(),
});

export const attendanceBulkIdsSchema = z.object({
  ids: z.array(z.union([z.string(), z.number()])).min(1).max(500),
  deletionReason: z.string().max(500).optional(),
});

export const attendanceRecordListSchema = z.array(attendanceRecordSchema);

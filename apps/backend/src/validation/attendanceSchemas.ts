import { z } from 'zod';

const attendanceStatusSchema = z.enum(['present', 'absent', 'late', 'excused']);

export const attendanceRecordSchema = z
  .object({
    id: z.string(),
    classId: z.string(),
    date: z.string(),
    studentId: z.string(),
    studentName: z.string().optional().default(''),
    rollNo: z.string(),
    status: attendanceStatusSchema,
    timeIn: z.string(),
    timeOut: z.string(),
    notes: z.string(),
  })
  .passthrough();

export const attendanceListSchema = z.array(attendanceRecordSchema);

export const attendanceBulkSchema = z.object({
  records: attendanceListSchema,
});

export type AttendanceRecord = z.infer<typeof attendanceRecordSchema>;

import { z } from 'zod';

const sessionCoreSchema = z
  .object({
    id: z.string(),
    name: z.string().min(1),
    type: z.string(),
    status: z.enum(['active', 'upcoming', 'completed', 'cancelled']),
    startDate: z.string(),
    endDate: z.string(),
    baseFee: z.coerce.number().nonnegative(),
    currency: z.string().min(1),
    description: z.string().optional(),
    classes: z.array(z.record(z.string(), z.unknown())).optional(),
    timetable: z.array(z.record(z.string(), z.unknown())).optional(),
    discounts: z.array(z.record(z.string(), z.unknown())).optional(),
    budget: z.record(z.string(), z.unknown()).optional(),
    events: z.array(z.record(z.string(), z.unknown())).optional(),
    tabarruk: z.array(z.record(z.string(), z.unknown())).optional(),
  })
  .passthrough();

export const sessionRecordSchema = sessionCoreSchema;
export const sessionListSchema = z.array(sessionCoreSchema);

export type SessionRecord = z.infer<typeof sessionCoreSchema>;

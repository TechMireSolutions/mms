import { z } from 'zod';

export const contactRecordSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    firstName: z.string().min(1),
  })
  .passthrough();

export const contactListSchema = z.array(contactRecordSchema);

export type ContactRecord = z.infer<typeof contactRecordSchema>;

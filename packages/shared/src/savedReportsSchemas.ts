import { z } from 'zod';

/** Report categories supported by the generic saved-reports REST resource. */
export const GENERIC_SAVED_REPORT_CATEGORIES = [
  'students',
  'teachers',
  'attendance',
  'financial',
  'examinations',
  'questionBank',
  'hasanat',
  'sessions',
  'faculty',
] as const;

/** Validates a category supported by the generic saved-reports REST resource. */
export const genericSavedReportCategorySchema = z.enum(GENERIC_SAVED_REPORT_CATEGORIES);

/** A category supported by the generic saved-reports REST resource. */
export type GenericSavedReportCategory = z.infer<typeof genericSavedReportCategorySchema>;

/** Validates a persisted generic saved-report preset returned by the API. */
export const genericSavedReportSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
  category: genericSavedReportCategorySchema,
  filters: z.record(z.string(), z.unknown()),
  lastRun: z.iso.datetime(),
  createdBy: z.string().min(1),
  createdByName: z.string(),
  createdAt: z.iso.datetime(),
});

/** A personal saved-report preset containing report logic rather than report data. */
export type GenericSavedReport = z.infer<typeof genericSavedReportSchema>;

/** Validates the request body used to create a generic saved-report preset. */
export const genericSavedReportCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  category: genericSavedReportCategorySchema,
  filters: z.record(z.string(), z.unknown()),
});

/** Request body used to create a generic saved-report preset. */
export type GenericSavedReportCreateInput = z.infer<typeof genericSavedReportCreateSchema>;

/** Validates the category query required by generic saved-report operations. */
export const genericSavedReportListQuerySchema = z.object({
  category: genericSavedReportCategorySchema,
});

/** Category query required by generic saved-report operations. */
export type GenericSavedReportListQuery = z.infer<typeof genericSavedReportListQuerySchema>;

/** Validates route parameters identifying a generic saved-report preset. */
export const genericSavedReportIdParamsSchema = z.object({
  id: z.string().min(1),
});

/** Route parameters identifying a generic saved-report preset. */
export type GenericSavedReportIdParams = z.infer<typeof genericSavedReportIdParamsSchema>;

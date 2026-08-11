/**
 * Cross-module public surface for Examinations Query hooks.
 * Other features and shared UI must import from here — not `@/tenant/features/examinations/hooks/*`.
 */
export {
  useExaminationsExams,
  useExaminationsExamsCollection,
  useExaminationsResults,
  useExaminationsResultsCollection,
  useExaminationsMetrics,
  useExaminationsMutations,
} from "@/tenant/features/examinations/hooks/useExaminationsApi";
export { invalidateExaminationsQueries } from '@/tenant/features/examinations/hooks/invalidateExaminationsQueries';

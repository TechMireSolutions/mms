import { useAttendanceRecordsCollection } from '@/tenant/hooks/collections/attendance';
import { useFinanceInvoicesCollection } from '@/tenant/hooks/collections/finance';
import { useExaminationsExamsCollection, useExaminationsResultsCollection } from '@/tenant/hooks/collections/examinations';
import { useHasanatDenomsCollection, useHasanatDistributionsCollection } from '@/tenant/hooks/collections/hasanat';
import {
  useQuestionBankQuestionsCollection,
  useQuestionBankResultsCollection,
  useQuestionBankTestsCollection,
} from '@/tenant/hooks/collections/questionBank';
import { useSessionsCollection } from '@/tenant/hooks/collections/sessions';
import { useContactsReportAnalytics } from '@/tenant/hooks/collections/contacts';
import { useStudentsMetrics } from '@/tenant/hooks/collections/students';
import { useTeachersMetrics } from '@/tenant/hooks/collections/teachers';
import type { KpiCategoryFlags } from './kpiSummaryCategoryFlags';

export type KpiSummaryDataSources = ReturnType<typeof useKpiSummaryDataSources>;

export function useKpiSummaryDataSources(category: string, flags: KpiCategoryFlags) {
  const { isContactsCategory, isStudentsCategory, isTeachersCategory, needsContactAnalytics } = flags;

  const { data: contactsReportData } = useContactsReportAnalytics({ enabled: needsContactAnalytics });
  const { data: studentMetrics } = useStudentsMetrics({ enabled: isStudentsCategory || category === 'enrollments' });
  const { data: teacherMetrics } = useTeachersMetrics({ enabled: isTeachersCategory || category === 'enrollments' });
  const { data: crossStudentMetrics } = useStudentsMetrics({
    enabled: !isStudentsCategory && !isContactsCategory && !isTeachersCategory && category !== 'enrollments',
  });
  const { data: crossTeacherMetrics } = useTeachersMetrics({
    enabled: !isTeachersCategory && category !== 'enrollments',
  });

  const attendanceRecords = useAttendanceRecordsCollection();
  const invoices = useFinanceInvoicesCollection();
  const exams = useExaminationsExamsCollection();
  const examResults = useExaminationsResultsCollection();
  const sessions = useSessionsCollection();
  const distributions = useHasanatDistributionsCollection();
  const denominations = useHasanatDenomsCollection();
  const questionBankQuestions = useQuestionBankQuestionsCollection();
  const questionBankTests = useQuestionBankTestsCollection();
  const questionBankResults = useQuestionBankResultsCollection();

  const contactAnalytics = contactsReportData?.analytics;
  const auxiliaryStudentMetrics = category === 'enrollments' ? studentMetrics : crossStudentMetrics;
  const auxiliaryTeacherMetrics = category === 'enrollments' ? teacherMetrics : crossTeacherMetrics;

  return {
    contactAnalytics,
    studentMetrics,
    teacherMetrics,
    auxiliaryStudentMetrics,
    auxiliaryTeacherMetrics,
    attendanceRecords,
    invoices,
    exams,
    examResults,
    sessions,
    distributions,
    denominations,
    questionBankQuestions,
    questionBankTests,
    questionBankResults,
  };
}

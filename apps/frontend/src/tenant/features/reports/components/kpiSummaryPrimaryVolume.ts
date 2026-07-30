import type { QuestionBankQuestion, QuestionBankResult, QuestionBankTest } from '@mms/shared';
import type { AttendanceRecord } from '@/lib/data/attendanceData';
import type { Invoice } from '@/lib/data/financeData';
import type { Distribution } from '@/lib/data/hasanatData';
import type { Session } from '@/lib/data/sessionsData';
import type {
  ContactKPIAnalytics,
  EntityKPIMetrics,
  TeacherKPIMetrics,
} from './kpiSummaryTypes';

export interface PrimaryVolumeInputs {
  category: string;
  studentMetrics?: EntityKPIMetrics;
  teacherMetrics?: TeacherKPIMetrics;
  contactAnalytics?: ContactKPIAnalytics;
  attendanceRecords: AttendanceRecord[];
  invoices: Invoice[];
  distributions: Distribution[];
  sessions: Session[];
  examResults: unknown[];
  exams: unknown[];
  questionBankQuestions: QuestionBankQuestion[];
  questionBankTests: QuestionBankTest[];
  questionBankResults: QuestionBankResult[];
}

/** Resolves the primary record count shown for a report category KPI strip. */
export function computePrimaryVolume(inputs: PrimaryVolumeInputs): number {
  const {
    category,
    studentMetrics,
    teacherMetrics,
    contactAnalytics,
    attendanceRecords,
    invoices,
    distributions,
    sessions,
    examResults,
    exams,
    questionBankQuestions,
    questionBankTests,
    questionBankResults,
  } = inputs;

  switch (category) {
    case 'students': return studentMetrics?.total ?? 0;
    case 'contacts': return contactAnalytics?.total ?? 0;
    case 'attendance': return attendanceRecords.length;
    case 'financial':
    case 'accounting': return invoices.length;
    case 'hasanat': return distributions.length;
    case 'sessions': return sessions.length;
    case 'examinations': return examResults.length + exams.length;
    case 'questionBank':
      return questionBankQuestions.length + questionBankTests.length + questionBankResults.length;
    case 'enrollments': return (studentMetrics?.total ?? 0) + sessions.length;
    case 'teachers':
    case 'faculty': return teacherMetrics?.total ?? 0;
    default: return 0;
  }
}

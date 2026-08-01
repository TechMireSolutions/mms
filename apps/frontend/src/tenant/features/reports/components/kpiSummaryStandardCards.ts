import {
  Activity,
  AlertCircle,
  BarChart2,
  DollarSign,
  GraduationCap,
  MessageCircle,
  Star,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  formatNumber,
  type AttendanceCommandMetricsSnapshot,
  type FinanceCommandMetricsSnapshot,
  type HasanatCommandMetricsSnapshot,
  type SessionsCommandMetricsSnapshot,
  type ExaminationsCommandMetricsSnapshot,
  type QuestionBankCommandMetricsSnapshot,
  type QuestionBankQuestion,
  type QuestionBankResult,
  type QuestionBankTest,
} from '@mms/shared';
import type { TranslationFunction } from '@/lib/contexts/TranslationContext';
import type {
  CategorizedKPIItem,
  ContactKPIAnalytics,
  EntityKPIMetrics,
  TeacherKPIMetrics,
} from './kpiSummaryTypes';
import { buildQuestionBankKPICards } from './kpiSummaryQuestionBankCards';
import { computeDerivedKpiMetrics } from './kpiSummaryDerivedMetrics';

interface BuildStandardKPICardsOptions {
  category: string;
  activeCurrencyCode: string;
  contactAnalytics?: ContactKPIAnalytics;
  studentMetrics?: EntityKPIMetrics;
  auxiliaryStudentMetrics?: EntityKPIMetrics;
  teacherMetrics?: TeacherKPIMetrics;
  auxiliaryTeacherMetrics?: TeacherKPIMetrics;
  attendanceMetrics?: AttendanceCommandMetricsSnapshot;
  financeMetrics?: FinanceCommandMetricsSnapshot;
  hasanatMetrics?: HasanatCommandMetricsSnapshot;
  sessionsMetrics?: SessionsCommandMetricsSnapshot;
  examinationsMetrics?: ExaminationsCommandMetricsSnapshot;
  questionBankMetrics?: QuestionBankCommandMetricsSnapshot;
  questionBankQuestions: QuestionBankQuestion[];
  questionBankTests: QuestionBankTest[];
  questionBankResults: QuestionBankResult[];
  t: TranslationFunction;
}

export function buildStandardKPICards(options: BuildStandardKPICardsOptions): CategorizedKPIItem[] {
  const {
    category,
    activeCurrencyCode,
    contactAnalytics,
    studentMetrics,
    auxiliaryStudentMetrics,
    teacherMetrics,
    auxiliaryTeacherMetrics,
    t,
  } = options;

  const derived = computeDerivedKpiMetrics(options);
  const isStudentsCategory = category === 'students';
  const isTeachersCategory = category === 'teachers' || category === 'faculty';
  const teacherValues = isTeachersCategory ? teacherMetrics : auxiliaryTeacherMetrics;
  const contactsRecent = contactAnalytics?.newThisPeriod ?? 0;
  const { cards: questionBankCards } = buildQuestionBankKPICards({
    questionBankMetrics: options.questionBankMetrics,
    questionBankQuestions: options.questionBankQuestions,
    questionBankTests: options.questionBankTests,
    questionBankResults: options.questionBankResults,
    t,
  });

  return [
    {
      id: 'kpi-total-students', icon: Users, label: t('reports.kpi.totalStudents'), value: derived.totalStudentsValue,
      sub: derived.totalStudentsSub, color: 'primary', trend: derived.totalStudentsTrend, velocity: derived.totalStudentsVelocity,
      categories: ['students', 'enrollments'],
      isAvailable: category === 'contacts'
        ? (contactAnalytics?.total ?? 0) > 0
        : ((isStudentsCategory ? studentMetrics?.total : auxiliaryStudentMetrics?.total) ?? 0) > 0,
    },
    {
      id: 'kpi-avg-attendance', icon: UserCheck, label: t('reports.kpi.avgAttendance'), value: `${derived.attendanceRate}%`,
      sub: t('reports.kpi.sub.last30Days'), color: 'green', trend: derived.attendanceTrend,
      categories: ['attendance'], isAvailable: derived.hasAttendanceData,
    },
    {
      id: 'kpi-fee-collected', icon: DollarSign, label: t('reports.kpi.feeCollected'), value: `${activeCurrencyCode} ${(derived.collected / 1000).toFixed(1)}k`,
      sub: t('reports.kpi.sub.allTimeTotal'), color: 'blue', trend: derived.feesTrend, categories: ['financial', 'accounting'],
      isAvailable: derived.hasFinanceData && (options.financeMetrics?.paid ?? 0) > 0,
    },
    {
      id: 'kpi-outstanding', icon: AlertCircle, label: t('reports.kpi.outstanding'), value: `${activeCurrencyCode} ${(derived.outstanding / 1000).toFixed(1)}k`,
      sub: t('reports.kpi.sub.invoiceCount', { count: derived.outstandingInvoiceCount }), color: 'red', trend: derived.outstandingTrend,
      categories: ['financial', 'accounting'], isAvailable: derived.outstandingInvoiceCount > 0,
    },
    {
      id: 'kpi-hasanat-awarded', icon: Star, label: t('reports.kpi.hasanatAwarded'), value: formatNumber(derived.totalHasanat),
      sub: t('reports.kpi.sub.allStudents'), color: 'amber', trend: derived.hasanatTrend, categories: ['hasanat'], isAvailable: derived.hasHasanatData,
    },
    {
      id: 'kpi-pass-rate', icon: GraduationCap, label: t('reports.kpi.passRate'), value: `${derived.passRate}%`,
      sub: t('reports.kpi.sub.lastExamCycle'), color: 'violet', trend: 'flat', categories: ['examinations', 'students'],
      isAvailable: derived.hasExamData,
    },
    {
      id: 'kpi-capacity-used', icon: BarChart2, label: t('reports.kpi.capacityUsed'), value: `${derived.capacityUsed}%`,
      sub: t('reports.kpi.sub.acrossClasses', { count: derived.classesCount }), color: 'primary', trend: derived.sessionsTrend,
      categories: ['sessions', 'enrollments'], isAvailable: derived.hasSessionsData,
    },
    {
      id: 'kpi-growth-rate', icon: TrendingUp, label: t('reports.kpi.growthRate'), value: derived.growthValue,
      sub: derived.growthSub, color: 'green', trend: derived.growthTrend, categories: ['students', 'sessions'],
      isAvailable: (category === 'contacts' || category === 'students' || category === 'sessions')
        ? Boolean(contactAnalytics?.hasSignupDates)
        : false,
    },
    {
      id: 'kpi-whatsapp-verified', icon: MessageCircle, label: t('reports.contacts.kpi.whatsappVerified'),
      value: contactAnalytics ? `${contactAnalytics.whatsappRate}%` : '0%', sub: t('reports.contacts.kpi.whatsappSub'),
      color: 'amber', trend: 'flat', categories: ['contacts'], isAvailable: (contactAnalytics?.total ?? 0) > 0,
    },
    {
      id: 'kpi-active-contacts', icon: UserCheck, label: t('reports.contacts.kpi.activeContacts'),
      value: String(contactAnalytics?.activeCount ?? 0), sub: t('reports.contacts.kpi.activeContactsSub'),
      color: 'green', trend: 'flat', categories: ['contacts'], isAvailable: (contactAnalytics?.total ?? 0) > 0,
    },
    {
      id: 'kpi-total-contacts', icon: Users, label: t('reports.contacts.kpi.totalContacts'),
      value: String(contactAnalytics?.total ?? 0), sub: t('reports.contacts.kpi.newRecently', { count: contactsRecent }),
      color: 'primary', trend: contactsRecent > 0 ? 'up' : 'flat', categories: ['contacts'], isAvailable: (contactAnalytics?.total ?? 0) > 0,
    },
    ...questionBankCards,
    {
      id: 'kpi-total-faculty', icon: GraduationCap, label: t('reports.kpi.totalFaculty'), value: String(teacherValues?.total ?? 0),
      sub: t('reports.kpi.sub.activeCount', { count: teacherValues?.active ?? 0 }), color: 'primary',
      trend: (teacherValues?.newThisPeriod ?? 0) > 0 ? 'up' : 'flat',
      categories: ['teachers', 'faculty'], isAvailable: (teacherValues?.total ?? 0) > 0,
    },
    {
      id: 'kpi-on-leave', icon: Activity, label: t('reports.kpi.onLeave'), value: String(teacherValues?.onLeave ?? 0),
      sub: t('reports.kpi.sub.facultyOnLeave'), color: 'amber', trend: 'flat', categories: ['teachers', 'faculty'],
      isAvailable: (teacherValues?.onLeave ?? 0) > 0,
    },
  ];
}

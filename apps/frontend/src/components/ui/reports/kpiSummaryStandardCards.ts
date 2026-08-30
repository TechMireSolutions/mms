import {
  Activity,
  AlertCircle,
  BarChart2,
  DollarSign,
  GraduationCap,
  MessageCircle,
  MessageSquare,
  Receipt,
  ShieldCheck,
  Star,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  formatNumber,
  type AttendanceCommandMetricsSnapshot,
  type FinanceCommandMetricsSnapshot,
  type AccountingCommandMetricsSnapshot,
  type ObligationsCommandMetricsSnapshot,
  type UsersCommandMetricsSnapshot,
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
  accountingMetrics?: AccountingCommandMetricsSnapshot;
  obligationsMetrics?: ObligationsCommandMetricsSnapshot;
  usersMetrics?: UsersCommandMetricsSnapshot;
  messagingMetrics?: {
    total?: number;
    sentCount?: number;
    deliveredCount?: number;
    failedCount?: number;
    smsCount?: number;
    whatsappCount?: number;
    emailCount?: number;
  };
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
      sub: t('reports.kpi.sub.last30Days'), color: 'success', trend: derived.attendanceTrend,
      categories: ['attendance'], isAvailable: derived.hasAttendanceData,
    },
    {
      id: 'kpi-fee-collected', icon: DollarSign, label: t('reports.kpi.feeCollected'), value: `${activeCurrencyCode} ${(derived.collected / 1000).toFixed(1)}k`,
      sub: t('reports.kpi.sub.allTimeTotal'), color: 'info', trend: derived.feesTrend, categories: ['finance', 'financial', 'accounting'],
      isAvailable: derived.hasFinanceData && (options.financeMetrics?.paid ?? 0) > 0,
    },
    {
      id: 'kpi-outstanding', icon: AlertCircle, label: t('reports.kpi.outstanding'), value: `${activeCurrencyCode} ${(derived.outstanding / 1000).toFixed(1)}k`,
      sub: t('reports.kpi.sub.invoiceCount', { count: derived.outstandingInvoiceCount }), color: 'destructive', trend: derived.outstandingTrend,
      categories: ['finance', 'financial', 'accounting'], isAvailable: derived.outstandingInvoiceCount > 0,
    },
    {
      id: 'kpi-hasanat-awarded', icon: Star, label: t('reports.kpi.hasanatAwarded'), value: formatNumber(derived.totalHasanat),
      sub: t('reports.kpi.sub.allStudents'), color: 'warning', trend: derived.hasanatTrend, categories: ['hasanat'], isAvailable: derived.hasHasanatData,
    },
    {
      id: 'kpi-pass-rate', icon: GraduationCap, label: t('reports.kpi.passRate'), value: `${derived.passRate}%`,
      sub: t('reports.kpi.sub.lastExamCycle'), color: 'primary', trend: 'flat', categories: ['examinations', 'academic', 'students'],
      isAvailable: derived.hasExamData,
    },
    {
      id: 'kpi-capacity-used', icon: BarChart2, label: t('reports.kpi.capacityUsed'), value: `${derived.capacityUsed}%`,
      sub: t('reports.kpi.sub.acrossClasses', { count: derived.classesCount }), color: 'primary', trend: derived.sessionsTrend,
      categories: ['sessions', 'enrollments'], isAvailable: derived.hasSessionsData,
    },
    {
      id: 'kpi-growth-rate', icon: TrendingUp, label: t('reports.kpi.growthRate'), value: derived.growthValue,
      sub: derived.growthSub, color: 'success', trend: derived.growthTrend, categories: ['students', 'sessions'],
      isAvailable: (category === 'contacts' || category === 'students' || category === 'sessions')
        ? Boolean(contactAnalytics?.hasSignupDates)
        : false,
    },
    {
      id: 'kpi-whatsapp-verified', icon: MessageCircle, label: t('reports.contacts.kpi.whatsappVerified'),
      value: contactAnalytics ? `${contactAnalytics.whatsappRate}%` : '0%', sub: t('reports.contacts.kpi.whatsappSub'),
      color: 'warning', trend: 'flat', categories: ['contacts'], isAvailable: (contactAnalytics?.total ?? 0) > 0,
    },
    {
      id: 'kpi-missing-contact-info', icon: AlertCircle, label: t('reports.contacts.kpi.missingContactInfo'),
      value: String(contactAnalytics?.missingInfoCount ?? 0), sub: t('reports.contacts.kpi.missingContactInfoSub'),
      color: 'destructive', trend: 'flat', categories: ['contacts'],
      isAvailable: (contactAnalytics?.missingInfoCount ?? 0) > 0 || (contactAnalytics?.total ?? 0) > 0,
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
      sub: t('reports.kpi.sub.facultyOnLeave'), color: 'warning', trend: 'flat', categories: ['teachers', 'faculty'],
      isAvailable: (teacherValues?.onLeave ?? 0) > 0,
    },
    // Obligations
    {
      id: 'kpi-obligations-total', icon: Receipt, label: t('obligations.summary.kpi.totalCollections'),
      value: String(options.obligationsMetrics?.total ?? 0),
      sub: `${options.obligationsMetrics?.obligationTypes ?? 0} types`,
      color: 'primary', trend: 'flat', categories: ['obligations'],
      isAvailable: (options.obligationsMetrics?.total ?? 0) > 0,
    },
    {
      id: 'kpi-obligations-amount', icon: TrendingUp, label: t('obligations.summary.kpi.totalAmountReceived'),
      value: `${activeCurrencyCode} ${((options.obligationsMetrics?.totalAmount ?? 0) / 1000).toFixed(1)}k`,
      sub: `${activeCurrencyCode} Cash: ${((options.obligationsMetrics?.cash ?? 0) / 1000).toFixed(1)}k`,
      color: 'success', trend: 'flat', categories: ['obligations'],
      isAvailable: (options.obligationsMetrics?.totalAmount ?? 0) > 0,
    },
    // Accounting
    {
      id: 'kpi-accounting-entries', icon: Receipt, label: t('accounting.reports.views.income'),
      value: String(options.accountingMetrics?.totalEntries ?? 0),
      sub: `${options.accountingMetrics?.posted ?? 0} posted`,
      color: 'primary', trend: 'flat', categories: ['accounting'],
      isAvailable: (options.accountingMetrics?.totalEntries ?? 0) > 0,
    },
    {
      id: 'kpi-accounting-surplus', icon: DollarSign, label: t('accounting.reports.netSurplus'),
      value: `${activeCurrencyCode} ${((options.accountingMetrics?.surplus ?? 0) / 1000).toFixed(1)}k`,
      sub: `${activeCurrencyCode} Rev: ${((options.accountingMetrics?.revenue ?? 0) / 1000).toFixed(1)}k`,
      color: (options.accountingMetrics?.surplus ?? 0) >= 0 ? 'success' : 'destructive',
      trend: 'flat', categories: ['accounting'],
      isAvailable: Boolean(options.accountingMetrics),
    },
    // Users
    {
      id: 'kpi-users-total', icon: Users, label: t('nav.users'),
      value: String(options.usersMetrics?.total ?? 0),
      sub: `${options.usersMetrics?.active ?? 0} active`,
      color: 'primary', trend: 'flat', categories: ['users'],
      isAvailable: (options.usersMetrics?.total ?? 0) > 0,
    },
    {
      id: 'kpi-users-sessions', icon: ShieldCheck, label: t('users.detailSessions'),
      value: String(options.usersMetrics?.activeSessions ?? 0),
      sub: `${options.usersMetrics?.twoFaEnabled ?? 0} 2FA`,
      color: 'info', trend: 'flat', categories: ['users'],
      isAvailable: (options.usersMetrics?.total ?? 0) > 0,
    },
    // Messaging
    {
      id: 'kpi-messaging-total', icon: MessageSquare, label: t('nav.messaging'),
      value: String(options.messagingMetrics?.total ?? 0),
      sub: `${options.messagingMetrics?.deliveredCount ?? 0} delivered`,
      color: 'primary', trend: 'flat', categories: ['messaging'],
      isAvailable: (options.messagingMetrics?.total ?? 0) > 0,
    },
    {
      id: 'kpi-messaging-whatsapp', icon: MessageCircle, label: t('messaging.channel.whatsapp'),
      value: String(options.messagingMetrics?.whatsappCount ?? 0),
      sub: `SMS: ${options.messagingMetrics?.smsCount ?? 0}`,
      color: 'success', trend: 'flat', categories: ['messaging'],
      isAvailable: (options.messagingMetrics?.total ?? 0) > 0,
    },
  ];
}

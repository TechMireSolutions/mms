import {
  Activity,
  AlertCircle,
  BarChart2,
  CalendarCheck,
  DollarSign,
  GraduationCap,
  MessageCircle,
  Star,
  Target,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import { formatNumber, type QuestionBankQuestion, type QuestionBankResult, type QuestionBankTest } from '@mms/shared';
import type { TranslationFunction } from '@/lib/contexts/TranslationContext';
import type { AttendanceRecord } from '@/lib/data/attendanceData';
import type { Invoice } from '@/lib/data/financeData';
import type { Session } from '@/lib/data/sessionsData';
import type { Denomination, Distribution } from '@/lib/data/hasanatData';
import type {
  CategorizedKPIItem,
  ContactKPIAnalytics,
  EntityKPIMetrics,
  TeacherKPIMetrics,
} from './kpiSummaryTypes';

interface BuildStandardKPICardsOptions {
  category: string;
  activeCurrencyCode: string;
  contactAnalytics?: ContactKPIAnalytics;
  studentMetrics?: EntityKPIMetrics;
  auxiliaryStudentMetrics?: EntityKPIMetrics;
  teacherMetrics?: TeacherKPIMetrics;
  auxiliaryTeacherMetrics?: TeacherKPIMetrics;
  attendanceRecords: AttendanceRecord[];
  invoices: Invoice[];
  exams: Array<{ id: string; passingMarks: number }>;
  examResults: Array<{ examId: string; marksObtained: number }>;
  sessions: Session[];
  distributions: Distribution[];
  denominations: Denomination[];
  questionBankQuestions: QuestionBankQuestion[];
  questionBankTests: QuestionBankTest[];
  questionBankResults: QuestionBankResult[];
  t: TranslationFunction;
}

export function buildStandardKPICards({
  category,
  activeCurrencyCode,
  contactAnalytics,
  studentMetrics,
  auxiliaryStudentMetrics,
  teacherMetrics,
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
  t,
}: BuildStandardKPICardsOptions): CategorizedKPIItem[] {
  const isStudentsCategory = category === 'students';
  const isTeachersCategory = category === 'teachers' || category === 'faculty';
  const needsContactAnalytics = category === 'contacts' || category === 'students' || category === 'sessions';

  let totalStudentsValue = '0';
  let totalStudentsSub = t('reports.kpi.sub.noStudents');
  let totalStudentsTrend: CategorizedKPIItem['trend'] = 'flat';
  let totalStudentsVelocity: string | undefined;
  if (category === 'contacts' && contactAnalytics) {
    totalStudentsValue = String(contactAnalytics.total);
    totalStudentsSub = t('reports.kpi.sub.newRecentlyCount', { count: contactAnalytics.newLast30Days });
    totalStudentsTrend = contactAnalytics.newLast30Days >= contactAnalytics.newPrior30Days ? 'up' : 'down';
    totalStudentsVelocity = contactAnalytics.newPrior30Days > 0
      ? `${Math.round(((contactAnalytics.newLast30Days - contactAnalytics.newPrior30Days) / contactAnalytics.newPrior30Days) * 100)}%`
      : `+${contactAnalytics.newLast30Days}`;
  } else if (category === 'contacts') {
    totalStudentsSub = t('reports.kpi.sub.noContacts');
  } else {
    const metrics = isStudentsCategory ? studentMetrics : auxiliaryStudentMetrics;
    totalStudentsValue = String(metrics?.total ?? 0);
    totalStudentsSub = t('reports.kpi.sub.activeNow', { count: metrics?.active ?? 0 });
    totalStudentsTrend = (metrics?.newThisPeriod ?? 0) > 0 ? 'up' : 'flat';
  }

  const presentCount = attendanceRecords.filter((record) => record.status === 'present' || record.status === 'late').length;
  const attendanceRate = attendanceRecords.length > 0 ? Math.round((presentCount / attendanceRecords.length) * 100) : 0;
  const collected = invoices.filter((invoice) => invoice.status === 'paid').reduce((sum, invoice) => sum + invoice.finalAmt, 0);
  const outstandingInvoices = invoices.filter((invoice) => invoice.status !== 'paid' && invoice.status !== 'cancelled');
  const outstanding = outstandingInvoices.reduce((sum, invoice) => sum + (invoice.finalAmt - (invoice.paidAmt || 0)), 0);
  const totalHasanat = distributions.reduce((sum, distribution) => {
    const denominationName = (distribution.denominationName || '').toLowerCase();
    const denomination = denominations.find((option) => option.id === distribution.denominationId);
    const points = denomination?.points ?? (
      denominationName.includes('silver') ? 150
        : denominationName.includes('gold') ? 500
          : denominationName.includes('platinum') ? 1000
            : denominationName.includes('diamond') ? 2500 : 50
    );
    return sum + (distribution.quantity || 1) * points;
  }, 0);

  let passCount = 0;
  let resultCount = 0;
  examResults.forEach((result) => {
    const exam = exams.find((option) => option.id === result.examId);
    if (!exam) return;
    resultCount += 1;
    if (result.marksObtained >= exam.passingMarks) passCount += 1;
  });
  const passRate = resultCount > 0 ? Math.round((passCount / resultCount) * 100) : 0;

  let questionBankTotalObtained = 0;
  let questionBankTotalMax = 0;
  questionBankResults.forEach((result) => {
    const test = questionBankTests.find((option) => option.id === result.testId);
    if (!test) return;
    questionBankTotalObtained += Object.values(result.scores).reduce(
      (sum, score) => sum + (typeof score === 'number' ? score : 0),
      0,
    );
    questionBankTotalMax += test.questionIds.reduce((sum, questionId) => {
      const question = questionBankQuestions.find((option) => option.id === questionId);
      return sum + (question?.marks ?? 0);
    }, 0);
  });
  const averageQuestionBankScore = questionBankTotalMax > 0
    ? `${Math.round((questionBankTotalObtained / questionBankTotalMax) * 100)}%`
    : '0%';

  const activeSessions = sessions.filter((session) => session.status === 'active');
  const classes = activeSessions.flatMap((session) => session.classes || []);
  const enrolled = classes.reduce((sum, sessionClass) => sum + (sessionClass.enrolled || 0), 0);
  const capacity = classes.reduce((sum, sessionClass) => sum + (sessionClass.capacity || 0), 0);
  const capacityUsed = capacity > 0 ? Math.round((enrolled / capacity) * 100) : 0;

  let growthValue = '+0%';
  let growthTrend: CategorizedKPIItem['trend'] = 'flat';
  let growthSub = t('reports.kpi.sub.noSignupDates');
  if (needsContactAnalytics && contactAnalytics?.hasSignupDates) {
    const recent = contactAnalytics.growthRecentSignups30d;
    const prior = contactAnalytics.growthPriorSignups30d;
    if (prior === 0) {
      growthValue = recent > 0 ? `+${recent * 100}%` : '0%';
      growthTrend = recent > 0 ? 'up' : 'flat';
      growthSub = t('reports.kpi.sub.growthNewLast30d', { count: recent });
    } else {
      const percentage = Math.round(((recent - prior) / prior) * 100);
      growthValue = `${percentage >= 0 ? '+' : ''}${percentage}%`;
      growthTrend = percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'flat';
      growthSub = t('reports.kpi.sub.growthVsPrevious', { recent, prior });
    }
  }

  const teacherValues = isTeachersCategory ? teacherMetrics : auxiliaryTeacherMetrics;
  const contactsRecent = contactAnalytics?.newThisPeriod ?? 0;
  return [
    {
      id: 'kpi-total-students', icon: Users, label: t('reports.kpi.totalStudents'), value: totalStudentsValue,
      sub: totalStudentsSub, color: 'primary', trend: totalStudentsTrend, velocity: totalStudentsVelocity,
      categories: ['students', 'enrollments'],
      isAvailable: category === 'contacts'
        ? (contactAnalytics?.total ?? 0) > 0
        : ((isStudentsCategory ? studentMetrics?.total : auxiliaryStudentMetrics?.total) ?? 0) > 0,
    },
    {
      id: 'kpi-avg-attendance', icon: UserCheck, label: t('reports.kpi.avgAttendance'), value: `${attendanceRate}%`,
      sub: t('reports.kpi.sub.last30Days'), color: 'green', trend: attendanceRate > 85 ? 'up' : 'flat',
      categories: ['attendance'], isAvailable: attendanceRecords.length > 0,
    },
    {
      id: 'kpi-fee-collected', icon: DollarSign, label: t('reports.kpi.feeCollected'), value: `${activeCurrencyCode} ${(collected / 1000).toFixed(1)}k`,
      sub: t('reports.kpi.sub.allTimeTotal'), color: 'blue', trend: 'up', categories: ['financial', 'accounting'],
      isAvailable: invoices.some((invoice) => invoice.status === 'paid'),
    },
    {
      id: 'kpi-outstanding', icon: AlertCircle, label: t('reports.kpi.outstanding'), value: `${activeCurrencyCode} ${(outstanding / 1000).toFixed(1)}k`,
      sub: t('reports.kpi.sub.invoiceCount', { count: outstandingInvoices.length }), color: 'red', trend: 'down',
      categories: ['financial', 'accounting'], isAvailable: outstandingInvoices.length > 0,
    },
    {
      id: 'kpi-hasanat-awarded', icon: Star, label: t('reports.kpi.hasanatAwarded'), value: formatNumber(totalHasanat),
      sub: t('reports.kpi.sub.allStudents'), color: 'amber', trend: 'up', categories: ['hasanat'], isAvailable: distributions.length > 0,
    },
    {
      id: 'kpi-pass-rate', icon: GraduationCap, label: t('reports.kpi.passRate'), value: `${passRate}%`,
      sub: t('reports.kpi.sub.lastExamCycle'), color: 'violet', trend: 'flat', categories: ['examinations', 'students'],
      isAvailable: examResults.length > 0 && exams.length > 0,
    },
    {
      id: 'kpi-capacity-used', icon: BarChart2, label: t('reports.kpi.capacityUsed'), value: `${capacityUsed}%`,
      sub: t('reports.kpi.sub.acrossClasses', { count: classes.length }), color: 'primary', trend: 'up',
      categories: ['sessions', 'enrollments'], isAvailable: sessions.length > 0,
    },
    {
      id: 'kpi-growth-rate', icon: TrendingUp, label: t('reports.kpi.growthRate'), value: growthValue,
      sub: growthSub, color: 'green', trend: growthTrend, categories: ['students', 'sessions'],
      isAvailable: needsContactAnalytics ? Boolean(contactAnalytics?.hasSignupDates) : false,
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
    {
      id: 'kpi-total-questions', icon: BarChart2, label: t('reports.kpi.totalQuestions'), value: String(questionBankQuestions.length),
      sub: t('reports.kpi.sub.inQuestionBank'), color: 'primary', trend: 'up', categories: ['questionBank'], isAvailable: questionBankQuestions.length > 0,
    },
    {
      id: 'kpi-generated-tests', icon: CalendarCheck, label: t('reports.kpi.generatedTests'), value: String(questionBankTests.length),
      sub: t('reports.kpi.sub.autoBuiltPapers'), color: 'blue', trend: 'flat', categories: ['questionBank'], isAvailable: questionBankTests.length > 0,
    },
    {
      id: 'kpi-test-submissions', icon: UserCheck, label: t('reports.kpi.testSubmissions'), value: String(questionBankResults.length),
      sub: t('reports.kpi.sub.gradedAttempts'), color: 'violet', trend: 'up', categories: ['questionBank'], isAvailable: questionBankResults.length > 0,
    },
    {
      id: 'kpi-avg-test-score', icon: Target, label: t('reports.kpi.avgTestScore'), value: averageQuestionBankScore,
      sub: t('reports.kpi.sub.acrossSubmissions'), color: 'green', trend: 'flat', categories: ['questionBank'],
      isAvailable: questionBankResults.length > 0 && questionBankTotalMax > 0,
    },
    {
      id: 'kpi-total-faculty', icon: GraduationCap, label: t('reports.kpi.totalFaculty'), value: String(teacherValues?.total ?? 0),
      sub: t('reports.kpi.sub.activeCount', { count: teacherValues?.active ?? 0 }), color: 'primary', trend: 'flat',
      categories: ['teachers', 'faculty'], isAvailable: (teacherValues?.total ?? 0) > 0,
    },
    {
      id: 'kpi-on-leave', icon: Activity, label: t('reports.kpi.onLeave'), value: String(teacherValues?.onLeave ?? 0),
      sub: t('reports.kpi.sub.facultyOnLeave'), color: 'amber', trend: 'flat', categories: ['teachers', 'faculty'],
      isAvailable: (teacherValues?.onLeave ?? 0) > 0,
    },
  ];
}

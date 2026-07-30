import { formatNumber } from '@mms/shared';
import type { TranslationFunction } from '@/lib/contexts/TranslationContext';
import type { AttendanceRecord } from '@/lib/data/attendanceData';
import type { Invoice } from '@/lib/data/financeData';
import type { Session } from '@/lib/data/sessionsData';
import type { Denomination, Distribution } from '@/lib/data/hasanatData';
import type { ContactKPIAnalytics, EntityKPIMetrics } from './kpiSummaryTypes';

interface DerivedKpiMetrics {
  attendanceRate: number;
  collected: number;
  outstanding: number;
  outstandingInvoiceCount: number;
  totalHasanat: number;
  passRate: number;
  capacityUsed: number;
  classesCount: number;
  growthValue: string;
  growthTrend: 'up' | 'down' | 'flat';
  growthSub: string;
  totalStudentsValue: string;
  totalStudentsSub: string;
  totalStudentsTrend: 'up' | 'down' | 'flat';
  totalStudentsVelocity?: string;
}

interface ComputeDerivedKpiMetricsOptions {
  category: string;
  contactAnalytics?: ContactKPIAnalytics;
  studentMetrics?: EntityKPIMetrics;
  auxiliaryStudentMetrics?: EntityKPIMetrics;
  attendanceRecords: AttendanceRecord[];
  invoices: Invoice[];
  exams: Array<{ id: string; passingMarks: number }>;
  examResults: Array<{ examId: string; marksObtained: number }>;
  sessions: Session[];
  distributions: Distribution[];
  denominations: Denomination[];
  t: TranslationFunction;
}

export function computeDerivedKpiMetrics({
  category,
  contactAnalytics,
  studentMetrics,
  auxiliaryStudentMetrics,
  attendanceRecords,
  invoices,
  exams,
  examResults,
  sessions,
  distributions,
  denominations,
  t,
}: ComputeDerivedKpiMetricsOptions): DerivedKpiMetrics {
  const isStudentsCategory = category === 'students';
  const needsContactAnalytics = category === 'contacts' || category === 'students' || category === 'sessions';

  let totalStudentsValue = '0';
  let totalStudentsSub = t('reports.kpi.sub.noStudents');
  let totalStudentsTrend: DerivedKpiMetrics['totalStudentsTrend'] = 'flat';
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

  const activeSessions = sessions.filter((session) => session.status === 'active');
  const classes = activeSessions.flatMap((session) => session.classes || []);
  const enrolled = classes.reduce((sum, sessionClass) => sum + (sessionClass.enrolled || 0), 0);
  const capacity = classes.reduce((sum, sessionClass) => sum + (sessionClass.capacity || 0), 0);
  const capacityUsed = capacity > 0 ? Math.round((enrolled / capacity) * 100) : 0;

  let growthValue = '+0%';
  let growthTrend: DerivedKpiMetrics['growthTrend'] = 'flat';
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

  return {
    attendanceRate,
    collected,
    outstanding,
    outstandingInvoiceCount: outstandingInvoices.length,
    totalHasanat,
    passRate,
    capacityUsed,
    classesCount: classes.length,
    growthValue,
    growthTrend,
    growthSub,
    totalStudentsValue,
    totalStudentsSub,
    totalStudentsTrend,
    totalStudentsVelocity,
  };
}

export { formatNumber };

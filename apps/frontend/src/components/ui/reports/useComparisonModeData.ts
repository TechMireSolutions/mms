import { useMemo } from 'react';
import { formatDate, type AppTranslationKey } from '@mms/shared';
import { useSessionsCollection } from '@/tenant/hooks/collections/sessions';
import { useContactsReportAnalytics } from '@/tenant/hooks/collections/contacts';
import { useEnrollmentsReportAggregates } from '@/tenant/hooks/collections/enrollments';
import { useAttendanceReportAggregates } from '@/tenant/hooks/collections/attendance';
import { useFinanceReportAggregates } from '@/tenant/hooks/collections/finance';
import { useHasanatReportAggregates } from '@/tenant/hooks/collections/hasanat';
import { useExaminationsReportAggregates } from '@/tenant/hooks/collections/examinations';
import {
  buildContactsDateRangeComparison,
  computeDynamicDateRangeComparison,
  computeDynamicSessionComparison,
} from './comparisonModeCompute';
import type { ComparisonDataItem, DateRange, DateRangeDataItem } from './comparisonModeTypes';

interface UseComparisonModeDataParams {
  category: string;
  isContacts: boolean;
  mode: 'sessions' | 'daterange';
  valA: string;
  valB: string;
  rangeA: DateRange;
  rangeB: DateRange;
  language: string;
  t: (key: AppTranslationKey) => string;
}

export function useComparisonModeData({
  category,
  isContacts,
  mode,
  valA,
  valB,
  rangeA,
  rangeB,
  language,
  t,
}: UseComparisonModeDataParams) {
  const compareYears = useMemo(() => {
    if (!isContacts || mode !== 'daterange') return undefined;
    const yearA = Number.parseInt(rangeA.from.slice(0, 4), 10);
    const yearB = Number.parseInt(rangeB.from.slice(0, 4), 10);
    return [yearA, yearB].filter((year) => Number.isFinite(year));
  }, [isContacts, mode, rangeA.from, rangeB.from]);

  const { data: reportData } = useContactsReportAnalytics({
    enabled: isContacts,
    compareYears,
    language,
  });

  const nonContactsEnabled = !isContacts;
  const categoryKey = category.toLowerCase();
  const needsEnrollmentDateRange =
    nonContactsEnabled && mode === 'daterange' && (categoryKey === 'students' || categoryKey === 'enrollments');
  const needsEnrollmentSessionCompare = nonContactsEnabled && mode === 'sessions';
  const needsFinanceSessionCompare = nonContactsEnabled && mode === 'sessions';
  const needsFinanceDateRange = nonContactsEnabled && mode === 'daterange' && categoryKey === 'financial';
  const needsAttendanceSessionCompare = nonContactsEnabled && mode === 'sessions';
  const needsAttendanceDateRange = nonContactsEnabled && mode === 'daterange' && categoryKey === 'attendance';
  const needsHasanatSessionCompare = nonContactsEnabled && mode === 'sessions';
  const needsHasanatDateRange = nonContactsEnabled && mode === 'daterange' && categoryKey === 'hasanat';

  const enrollmentComparison = useMemo(() => {
    if (needsEnrollmentSessionCompare) {
      return { sessionIds: [valA, valB].filter(Boolean) };
    }
    if (needsEnrollmentDateRange) {
      return {
        rangeAFrom: rangeA.from,
        rangeATo: rangeA.to,
        rangeBFrom: rangeB.from,
        rangeBTo: rangeB.to,
      };
    }
    return undefined;
  }, [needsEnrollmentSessionCompare, needsEnrollmentDateRange, valA, valB, rangeA.from, rangeA.to, rangeB.from, rangeB.to]);

  const financeComparison = useMemo(() => {
    if (needsFinanceSessionCompare) {
      return { sessionIds: [valA, valB].filter(Boolean) };
    }
    if (needsFinanceDateRange) {
      return {
        rangeAFrom: rangeA.from,
        rangeATo: rangeA.to,
        rangeBFrom: rangeB.from,
        rangeBTo: rangeB.to,
      };
    }
    return undefined;
  }, [needsFinanceSessionCompare, needsFinanceDateRange, valA, valB, rangeA.from, rangeA.to, rangeB.from, rangeB.to]);

  const attendanceComparison = useMemo(() => {
    if (needsAttendanceSessionCompare) {
      return { sessionIds: [valA, valB].filter(Boolean) };
    }
    if (needsAttendanceDateRange) {
      return {
        rangeAFrom: rangeA.from,
        rangeATo: rangeA.to,
        rangeBFrom: rangeB.from,
        rangeBTo: rangeB.to,
      };
    }
    return undefined;
  }, [needsAttendanceSessionCompare, needsAttendanceDateRange, valA, valB, rangeA.from, rangeA.to, rangeB.from, rangeB.to]);

  const examinationsComparison = useMemo(() => {
    if (nonContactsEnabled && mode === 'sessions') {
      return { sessionIds: [valA, valB].filter(Boolean) };
    }
    if (nonContactsEnabled && mode === 'daterange' && categoryKey === 'examinations') {
      return {
        rangeAFrom: rangeA.from,
        rangeATo: rangeA.to,
        rangeBFrom: rangeB.from,
        rangeBTo: rangeB.to,
      };
    }
    return undefined;
  }, [nonContactsEnabled, mode, categoryKey, valA, valB, rangeA.from, rangeA.to, rangeB.from, rangeB.to]);

  const hasanatComparison = useMemo(() => {
    if (needsHasanatSessionCompare) {
      return { sessionIds: [valA, valB].filter(Boolean) };
    }
    if (needsHasanatDateRange) {
      return {
        rangeAFrom: rangeA.from,
        rangeATo: rangeA.to,
        rangeBFrom: rangeB.from,
        rangeBTo: rangeB.to,
      };
    }
    return undefined;
  }, [needsHasanatSessionCompare, needsHasanatDateRange, valA, valB, rangeA.from, rangeA.to, rangeB.from, rangeB.to]);

  const { data: enrollmentsReport } = useEnrollmentsReportAggregates({
    enabled: Boolean(enrollmentComparison),
    comparison: enrollmentComparison,
  });

  const { data: financeReport } = useFinanceReportAggregates({
    enabled: Boolean(financeComparison),
    comparison: financeComparison,
  });

  const { data: attendanceReport } = useAttendanceReportAggregates({
    enabled: Boolean(attendanceComparison),
    comparison: attendanceComparison,
  });

  const { data: hasanatReport } = useHasanatReportAggregates({
    enabled: Boolean(hasanatComparison),
    comparison: hasanatComparison,
  });

  const { data: examinationsReport } = useExaminationsReportAggregates({
    enabled: Boolean(examinationsComparison),
    comparison: examinationsComparison,
  });

  const sessions = useSessionsCollection({ enabled: nonContactsEnabled });
  const sessionsOptions = useMemo<{ id: string; name: string }[]>(
    () =>
      sessions
        .filter((session) => session.id !== 'all')
        .map((session) => ({ id: session.id, name: session.name })),
    [sessions],
  );

  const comparisonData = useMemo<ComparisonDataItem[] | DateRangeDataItem[]>(() => {
    if (mode === 'sessions') {
      if (isContacts) {
        return [];
      }
      return computeDynamicSessionComparison(
        sessions,
        enrollmentsReport?.comparison?.sessions ?? [],
        attendanceReport?.comparison?.sessions ?? [],
        financeReport?.comparison?.sessions ?? [],
        hasanatReport?.comparison?.sessions ?? [],
        examinationsReport?.comparison?.sessions ?? [],
        valA,
        valB,
        t,
      );
    }
    if (isContacts) {
      return buildContactsDateRangeComparison(reportData?.monthlyByYear, rangeA, rangeB);
    }
    return computeDynamicDateRangeComparison(
      category,
      enrollmentsReport?.comparison?.monthly,
      attendanceReport?.comparison?.monthly,
      financeReport?.comparison?.monthly,
      hasanatReport?.comparison?.monthly,
      examinationsReport?.comparison?.monthly,
      rangeA,
      rangeB,
    );
  }, [
    mode,
    isContacts,
    reportData,
    valA,
    valB,
    rangeA,
    rangeB,
    sessions,
    enrollmentsReport,
    attendanceReport,
    financeReport,
    hasanatReport,
    examinationsReport,
    category,
    t,
  ]);

  const labelA =
    mode === 'sessions'
      ? sessionsOptions.find((option) => option.id === valA)?.name
      : `${formatDate(rangeA.from)} → ${formatDate(rangeA.to)}`;
  const labelB =
    mode === 'sessions'
      ? sessionsOptions.find((option) => option.id === valB)?.name
      : `${formatDate(rangeB.from)} → ${formatDate(rangeB.to)}`;

  return {
    reportData,
    enrollmentsReport,
    financeReport,
    attendanceReport,
    hasanatReport,
    examinationsReport,
    sessions,
    sessionsOptions,
    comparisonData,
    labelA,
    labelB,
  };
}
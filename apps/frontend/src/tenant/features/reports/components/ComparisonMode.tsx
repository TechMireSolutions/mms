import React, { useState, useMemo, useEffect } from "react";
import { GitCompare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { useTranslation } from "@/hooks/useTranslation";
import { useSessionsCollection } from '@/tenant/hooks/collections/sessions';
import { useContactsReportAnalytics } from '@/tenant/hooks/collections/contacts';
import { useEnrollmentsCollection } from "@/tenant/hooks/collections/enrollments";
import { useAttendanceRecordsCollection } from "@/tenant/hooks/collections/attendance";
import { useFinanceInvoicesCollection } from "@/tenant/hooks/collections/finance";
import { useHasanatDistributionsCollection, useHasanatDenomsCollection } from "@/tenant/hooks/collections/hasanat";
import { useExaminationsExamsCollection, useExaminationsResultsCollection } from "@/tenant/hooks/collections/examinations";
import { formatDate } from "@mms/shared";
import { ComparisonModeCharts } from "./ComparisonModeCharts";
import {
  buildContactsDateRangeComparison,
  computeDynamicDateRangeComparison,
  computeDynamicSessionComparison,
} from "./comparisonModeCompute";
import { translateComparisonMetricName } from "./comparisonModeMetricLabels";
import { ComparisonModeSelectors } from "./ComparisonModeSelectors";
import type { ComparisonDataItem, ComparisonModeProps, DateRange } from "./comparisonModeTypes";

/**
 * ComparisonMode component that displays side-by-side session or date range comparisons.
 *
 * @param props - Component props.
 * @returns React.JSX.Element
 */
export default function ComparisonMode({ category, onClose }: ComparisonModeProps): React.JSX.Element {
  const { t, language } = useTranslation();

  const isContacts = category.toLowerCase() === "contacts";
  const [mode, setMode] = useState<"sessions" | "daterange">("sessions");
  const [valA, setValA] = useState<string>("s1");
  const [valB, setValB] = useState<string>("s2");
  const [rangeA, setRangeA] = useState<DateRange>({ from: "2025-01-01", to: "2025-03-31" });
  const [rangeB, setRangeB] = useState<DateRange>({ from: "2026-01-01", to: "2026-03-31" });
  const modeTabs = useMemo(
    () => [
      { key: "sessions" as const, label: t("reports.comparison.sessions") },
      { key: "daterange" as const, label: t("reports.comparison.dateRanges") },
    ],
    [t],
  );

  const compareYears = useMemo(() => {
    if (!isContacts || mode !== "daterange") return undefined;
    const yearA = Number.parseInt(rangeA.from.slice(0, 4), 10);
    const yearB = Number.parseInt(rangeB.from.slice(0, 4), 10);
    return [yearA, yearB].filter((year) => Number.isFinite(year));
  }, [isContacts, mode, rangeA.from, rangeB.from]);

  const { data: reportData } = useContactsReportAnalytics({
    enabled: isContacts,
    compareYears,
    language,
  });
  // Contacts Compare uses /report-analytics years only — skip unrelated collections.
  const nonContactsEnabled = !isContacts;
  const sessions = useSessionsCollection({ enabled: nonContactsEnabled });
  const SESSIONS_OPTIONS = useMemo<{id: string, name: string}[]>(
    () => sessions.filter((session) => session.id !== "all").map((session) => ({ id: session.id, name: session.name })),
    [sessions],
  );

  const enrollments = useEnrollmentsCollection({ enabled: nonContactsEnabled });
  const attendanceRecords = useAttendanceRecordsCollection({ enabled: nonContactsEnabled });
  const financeInvoices = useFinanceInvoicesCollection({ enabled: nonContactsEnabled });
  const hasanatDistributions = useHasanatDistributionsCollection({ enabled: nonContactsEnabled });
  const examResults = useExaminationsResultsCollection({ enabled: nonContactsEnabled });
  const exams = useExaminationsExamsCollection({ enabled: nonContactsEnabled });
  const denoms = useHasanatDenomsCollection({ enabled: nonContactsEnabled });

  useEffect(() => {
    if (isContacts) {
      setMode("daterange");
    } else {
      setMode("sessions");
      setValA("s1");
      setValB("s2");
    }
  }, [category, isContacts]);

  const options = SESSIONS_OPTIONS;
  const labelA = mode === "sessions" ? options.find((option) => option.id === valA)?.name : `${formatDate(rangeA.from)} → ${formatDate(rangeA.to)}`;
  const labelB = mode === "sessions" ? options.find((option) => option.id === valB)?.name : `${formatDate(rangeB.from)} → ${formatDate(rangeB.to)}`;

  const comparisonData = useMemo(() => {
    if (mode === "sessions") {
      if (isContacts) {
        return [];
      }
      return computeDynamicSessionComparison(
        sessions,
        enrollments,
        attendanceRecords,
        financeInvoices,
        hasanatDistributions,
        examResults,
        exams,
        denoms,
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
      enrollments,
      attendanceRecords,
      financeInvoices,
      hasanatDistributions,
      examResults,
      exams,
      denoms,
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
    enrollments,
    attendanceRecords,
    financeInvoices,
    hasanatDistributions,
    examResults,
    exams,
    denoms,
    category,
    t,
  ]);

  const translatedData = useMemo(() => {
    if (mode !== "sessions") return comparisonData;
    return (comparisonData as ComparisonDataItem[]).map((row) => ({
      ...row,
      metric: translateComparisonMetricName(row.metric, t),
    }));
  }, [comparisonData, mode, t]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm overflow-hidden"
    >
      <div className="flex flex-col gap-3 px-4 py-3 bg-primary/5 border-b border-border/50 text-start sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <GitCompare className="w-4 h-4 shrink-0 text-primary" />
          <span className="truncate text-sm font-bold text-foreground">{t("reports.comparison.title")}</span>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          {!isContacts && (
            <SubTabBar tabs={modeTabs} value={mode} onChange={setMode} panelIdPrefix="comparison-mode" className="min-w-0 flex-1" />
          )}
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-lg hover:bg-muted transition-colors"
            type="button"
            aria-label={t("reports.comparison.closeLabel")}
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <ComparisonModeSelectors
          mode={mode}
          isContacts={isContacts}
          valA={valA}
          valB={valB}
          setValA={setValA}
          setValB={setValB}
          rangeA={rangeA}
          rangeB={rangeB}
          setRangeA={setRangeA}
          setRangeB={setRangeB}
          options={options}
        />

        <ComparisonModeCharts
          mode={mode}
          translatedData={translatedData}
          labelA={labelA}
          labelB={labelB}
          isContacts={isContacts}
        />
      </div>
    </motion.div>
  );
}

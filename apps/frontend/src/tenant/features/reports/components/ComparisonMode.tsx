import React, { useState, useMemo, useEffect } from "react";
import { GitCompare, X } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/FormSelect";
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
import type { ComparisonDataItem, ComparisonModeProps, DateRange } from "./comparisonModeTypes";

/**
 * ComparisonMode component that displays side-by-side session or date range comparisons.
 *
 * @param props - Component props.
 * @returns React.JSX.Element
 */
export default function ComparisonMode({ category, onClose }: ComparisonModeProps): React.JSX.Element {
  const { t } = useTranslation();

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
  });
  const sessions = useSessionsCollection();
  const SESSIONS_OPTIONS = useMemo<{id: string, name: string}[]>(
    () => sessions.filter((session) => session.id !== "all").map((session) => ({ id: session.id, name: session.name })),
    [sessions],
  );

  const enrollments = useEnrollmentsCollection();
  const attendanceRecords = useAttendanceRecordsCollection();
  const financeInvoices = useFinanceInvoicesCollection();
  const hasanatDistributions = useHasanatDistributionsCollection();
  const examResults = useExaminationsResultsCollection();
  const exams = useExaminationsExamsCollection();
  const denoms = useHasanatDenomsCollection();



  // Sync targets when category changes
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
    const translateMetricName = (name: string): string => {
      switch (name) {
        case "Total Volume": return t("reports.comparison.metricTotalVolume");
        case "Conversion%": return t("reports.comparison.metricConversionPct");
        case "Engagement": return t("reports.comparison.metricEngagement");
        case "Active Status": return t("reports.comparison.metricActiveStatus");
        case "Enrollment": return t("reports.comparison.metricEnrollment");
        case "Attendance%": return t("reports.comparison.metricAttendance");
        case "Fee Collected": return t("reports.comparison.metricFeeCollected");
        case "Pass Rate%": return t("reports.comparison.metricPassRate");
        case "Hasanat": return t("reports.comparison.metricHasanat");
        default: return name;
      }
    };

    if (mode !== "sessions") return comparisonData;
    return (comparisonData as ComparisonDataItem[]).map((row) => ({
      ...row,
      metric: translateMetricName(row.metric),
    }));
  }, [comparisonData, mode, t]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm overflow-hidden"
    >
      {/* Header */}
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
        {/* Selectors */}
        {mode === "sessions" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-start">
            {[
              { label: "A", value: valA, setValue: setValA, color: "text-primary" },
              { label: "B", value: valB, setValue: setValB, color: "text-warning" }
            ].map(({ label, value, setValue, color }) => (
              <div key={label} className="flex flex-col gap-1">
                <label className={`text-xs font-bold uppercase tracking-wide ${color}`}>{isContacts ? t("reports.comparison.stage") : t("reports.comparison.session")} {label}</label>
                <FormSelect
                  value={value}
                  onChange={(newValue) => setValue(newValue)}
                  options={options.map((option) => ({ value: option.id, label: option.name }))}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-start">
            {[
              { label: t("reports.comparison.rangeA"), range: rangeA, setRange: setRangeA, color: "text-primary" },
              { label: t("reports.comparison.rangeB"), range: rangeB, setRange: setRangeB, color: "text-warning" }
            ].map(({ label, range, setRange, color }) => (
              <div key={label} className="space-y-2">
                <p className={`text-xs font-bold uppercase tracking-wide ${color}`}>{label}</p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <DatePicker
                    value={range.from}
                    onChange={(value) => setRange((currentRange) => ({ ...currentRange, from: value }))}
                    className="w-full flex-1 text-sm rounded-lg border border-border/50 bg-background/50 backdrop-blur-sm px-2 py-1.5"
                  />
                  <DatePicker
                    value={range.to}
                    onChange={(value) => setRange((currentRange) => ({ ...currentRange, to: value }))}
                    className="w-full flex-1 text-sm rounded-lg border border-border/50 bg-background/50 backdrop-blur-sm px-2 py-1.5"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

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

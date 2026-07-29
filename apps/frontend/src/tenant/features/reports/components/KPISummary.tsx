import React, { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, UserCheck, DollarSign, TrendingUp, Star, 
  AlertCircle, GraduationCap, BarChart2, LucideIcon, 
  Target, Zap, Activity, SlidersHorizontal,
  Plus, Trash2, ShieldCheck, Receipt, CalendarCheck, MessageCircle
} from "lucide-react";
import { useFinanceInvoicesCollection } from "@/tenant/hooks/collections/finance";

import { useExaminationsExamsCollection, useExaminationsResultsCollection } from "@/tenant/hooks/collections/examinations";
import { useHasanatDistributionsCollection, useHasanatDenomsCollection } from "@/tenant/hooks/collections/hasanat";
import {
  useQuestionBankQuestionsCollection,
  useQuestionBankTestsCollection,
  useQuestionBankResultsCollection,
} from "@/tenant/hooks/collections/questionBank";
import { getObject, saveObject } from "@/lib/db";
import { useContactsReportAnalytics, useContactsWidgetAggregates } from "@/tenant/hooks/collections/contacts";
import { useStudentsMetrics, useStudentsWidgetAggregates } from "@/tenant/hooks/collections/students";
import { useTeachersMetrics, useTeachersWidgetAggregates } from "@/tenant/hooks/collections/teachers";
import { useAttendanceRecordsCollection } from "@/tenant/hooks/collections/attendance";
import { useSessionsCollection } from "@/tenant/hooks/collections/sessions";
import { type Contact, type AppTranslationKey, formatNumber } from "@mms/shared";
import { type AttendanceRecord } from '@/lib/data/attendanceData';
import { type Invoice } from '@/lib/data/financeData';
import { type Student } from '@/lib/data/studentsData';
import { type Teacher } from '@/lib/data/teachersData';
import { type Session } from '@/lib/data/sessionsData';
import { type Distribution, type Denomination } from '@/lib/data/hasanatData';
import type { QuestionBankQuestion, QuestionBankResult, QuestionBankTest } from "@mms/shared";
import { computeCustomCard as computeCustomCardShared, CustomCard } from "@/tenant/features/reports/components/reportMetadata";
import DynamicCardBuilder from "@/tenant/features/reports/components/DynamicCardBuilder";
import { usePermissions } from "@/tenant/hooks/usePermissions";
import { useTranslation } from "@/hooks/useTranslation";
import { type TranslationFunction } from "@/lib/contexts/TranslationContext";
import { useFinanceCurrency } from "@/hooks/useCurrency";
import { resolveWidgetTitle, resolveWidgetSubText } from "@/lib/dashboardWidgets";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";

interface KPIItem {
  id: string;
  icon: LucideIcon;
  label: string;
  value: string;
  sub: string;
  color: "primary" | "green" | "blue" | "red" | "amber" | "violet";
  trend: "up" | "down" | "flat";
  velocity?: string;
  isAvailable: boolean;
}

function areStringListsEqual(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function areCustomCardsEqual(left: CustomCard[], right: CustomCard[]): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

const KPI_ROLE_ATTENDANCE_ONLY_IDS = [
  "kpi-total-students",
  "kpi-avg-attendance",
  "kpi-hasanat-awarded",
  "kpi-capacity-used",
];

const KPI_ROLE_FINANCE_ONLY_IDS = [
  "kpi-fee-collected",
  "kpi-outstanding",
  "kpi-growth-rate",
];

const KPI_TITLE_KEYS: Partial<Record<string, AppTranslationKey>> = {
  "kpi-total-students": "reports.kpi.totalStudents",
  "kpi-avg-attendance": "reports.kpi.avgAttendance",
  "kpi-fee-collected": "reports.kpi.feeCollected",
  "kpi-outstanding": "reports.kpi.outstanding",
  "kpi-hasanat-awarded": "reports.kpi.hasanatAwarded",
  "kpi-pass-rate": "reports.kpi.passRate",
  "kpi-capacity-used": "reports.kpi.capacityUsed",
  "kpi-growth-rate": "reports.kpi.growthRate",
  "kpi-total-questions": "reports.kpi.totalQuestions",
  "kpi-generated-tests": "reports.kpi.generatedTests",
  "kpi-test-submissions": "reports.kpi.testSubmissions",
  "kpi-avg-test-score": "reports.kpi.avgTestScore",
  "kpi-total-faculty": "reports.kpi.totalFaculty",
  "kpi-on-leave": "reports.kpi.onLeave",
  "kpi-whatsapp-verified": "reports.contacts.kpi.whatsappVerified",
  "kpi-active-contacts": "reports.contacts.kpi.activeContacts",
  "kpi-total-contacts": "reports.contacts.kpi.totalContacts",
};

function normalizeStoredCardIds(
  storedValues: string[],
  cards: (KPIItem & { categories: string[] })[],
): string[] {
  const cardByLabel = new Map(cards.map((card) => [card.label, card.id]));
  const cardIdSet = new Set(cards.map((card) => card.id));
  const resolvedIds: string[] = [];
  for (const storedValue of storedValues) {
    const resolvedId = cardIdSet.has(storedValue) ? storedValue : cardByLabel.get(storedValue);
    if (resolvedId && !resolvedIds.includes(resolvedId)) {
      resolvedIds.push(resolvedId);
    }
  }
  return resolvedIds;
}

function formatAggregateCardValue(
  card: CustomCard,
  aggregate: { value: number; totalCount: number },
): { finalValue: string | number; totalCount: number } {
  return {
    finalValue: card.operation === "percentage" ? `${aggregate.value}%` : aggregate.value,
    totalCount: aggregate.totalCount,
  };
}

interface ColorScheme {
  bg: string;
  text: string;
}

const COLOR: Record<string, ColorScheme> = {
  primary: { bg: "bg-primary/10",   text: "text-primary"     },
  green:   { bg: "bg-success/10",   text: "text-success" },
  emerald: { bg: "bg-success/10",   text: "text-success" },
  blue:    { bg: "bg-info/10",      text: "text-info"    },
  red:     { bg: "bg-destructive/10",       text: "text-destructive"     },
  amber:   { bg: "bg-warning/10",     text: "text-warning"   },
  violet:  { bg: "bg-primary/10",    text: "text-primary"  },
};

interface TrendScheme {
  cls: string;
  arrow: string;
}

const TREND: Record<string, TrendScheme> = {
  up:   { cls: "text-success", arrow: "↑" },
  down: { cls: "text-destructive",     arrow: "↓" },
  flat: { cls: "text-muted-foreground", arrow: "→" },
};

// ---------------------------------------------------------------------------
// SubtextDisplay: defined outside KPISummary to prevent per-render recreation
// (inline component definitions inside .map() cause React to remount on every
// render, which triggers Radix ref callbacks → setState → infinite loop).
// ---------------------------------------------------------------------------
function SubtextDisplay({ text }: { text: string }): React.JSX.Element {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 30;
  if (!isLong) return <span className="truncate block font-semibold">{text}</span>;
  return (
    <span className="block leading-normal font-semibold whitespace-normal break-words">
      {expanded ? text : `${text.slice(0, 30)}...`}
      <Button
        type="button"
        variant="link"
        onClick={(event) => { event.stopPropagation(); setExpanded((previousExpanded) => !previousExpanded); }}
        className="ml-1 h-auto p-0 text-primary hover:underline font-extrabold inline text-[9px] shadow-none"
      >
        {expanded ? t("common.showLess") : t("common.readMore")}
      </Button>
    </span>
  );
}



interface KPISummaryProps {
  category: string;
  role?: string;
}

/**
 * KPISummary component displays a row of KPI card metrics with trend indicators.
 * Filtered by both user role and module category.
 *
 * @param props - Component props.
 * @returns React.JSX.Element
 */
// CustomCard interface imported from reportMetadata

const ICONS: Record<string, React.ElementType> = {
  Users, UserCheck, DollarSign, TrendingUp, Star, 
  AlertCircle, GraduationCap, BarChart2, Target, Zap, Activity,
  CalendarCheck, Receipt, ShieldCheck
};

/**
 * Computes the value of a custom card.
 */
function computeCustomCard(
  card: CustomCard,
  collections: {
    students: Student[];
    teachers: Teacher[];
    sessions: Session[];
    finance_invoices: Invoice[];
    attendance_records: AttendanceRecord[];
    hasanat_distributions: Distribution[];
    contacts: Contact[];
    questions: QuestionBankQuestion[];
    tests: QuestionBankTest[];
    assessment_results: QuestionBankResult[];
    hasanat_denoms?: Denomination[];
  },
  t: TranslationFunction
): KPIItem & { categories: string[] } {
  const computedCard = computeCustomCardShared(
    {
      ...card,
      title: resolveWidgetTitle(card, t),
      fixedSubText: resolveWidgetSubText(card, t) || card.fixedSubText,
    },
    collections,
    t,
  );
  return {
    id: card.id,
    label: resolveWidgetTitle(card, t),
    value: String(computedCard.value),
    sub: resolveWidgetSubText(card, t) || computedCard.sub,
    icon: (ICONS[computedCard.icon] || BarChart2) as LucideIcon,
    color: (computedCard.color === "emerald" ? "green" : computedCard.color) as KPIItem["color"],
    trend: "flat" as const,
    isAvailable: true,
    categories: [] as string[]
  };
}

/**
 * Resolves the configuration of a pre-built card by category and card id.
 */
function getDefaultCardConfig(
  category: string,
  cardId: string,
  title: string,
  titleKey?: AppTranslationKey,
): CustomCard {
  const defaultCardConfig: CustomCard = {
    id: cardId,
    title,
    titleKey,
    collection: "students",
    operation: "count",
    filterField: "status",
    filterOperator: "equals",
    filterValue: "active",
    icon: "GraduationCap",
    color: "emerald",
    subTextType: "dynamic",
    fixedSubText: ""
  };

  switch (cardId) {
    case "kpi-total-students":
      if (category === "contacts") {
        defaultCardConfig.collection = "contacts";
        defaultCardConfig.filterField = "";
        defaultCardConfig.icon = "Users";
        defaultCardConfig.color = "blue";
      } else {
        defaultCardConfig.collection = "students";
        defaultCardConfig.filterField = "status";
        defaultCardConfig.filterValue = "active";
        defaultCardConfig.icon = "GraduationCap";
        defaultCardConfig.color = "emerald";
      }
      break;
    case "kpi-avg-attendance":
      defaultCardConfig.collection = "attendance_records";
      defaultCardConfig.operation = "percentage";
      defaultCardConfig.filterField = "status";
      defaultCardConfig.filterOperator = "equals";
      defaultCardConfig.filterValue = "present";
      defaultCardConfig.icon = "UserCheck";
      defaultCardConfig.color = "emerald";
      break;
    case "kpi-fee-collected":
      defaultCardConfig.collection = "finance_invoices";
      defaultCardConfig.operation = "sum";
      defaultCardConfig.targetField = "finalAmt";
      defaultCardConfig.filterField = "status";
      defaultCardConfig.filterOperator = "equals";
      defaultCardConfig.filterValue = "paid";
      defaultCardConfig.icon = "DollarSign";
      defaultCardConfig.color = "blue";
      break;
    case "kpi-outstanding":
      defaultCardConfig.collection = "finance_invoices";
      defaultCardConfig.operation = "sum";
      defaultCardConfig.targetField = "finalAmt";
      defaultCardConfig.filterField = "status";
      defaultCardConfig.filterOperator = "equals";
      defaultCardConfig.filterValue = "unpaid";
      defaultCardConfig.icon = "AlertCircle";
      defaultCardConfig.color = "red";
      break;
    case "kpi-hasanat-awarded":
      defaultCardConfig.collection = "hasanat_distributions";
      defaultCardConfig.operation = "sum";
      defaultCardConfig.targetField = "points";
      defaultCardConfig.filterField = "";
      defaultCardConfig.icon = "Star";
      defaultCardConfig.color = "amber";
      break;
    case "kpi-pass-rate":
      defaultCardConfig.collection = "students";
      defaultCardConfig.operation = "percentage";
      defaultCardConfig.filterField = "status";
      defaultCardConfig.filterOperator = "equals";
      defaultCardConfig.filterValue = "active";
      defaultCardConfig.icon = "GraduationCap";
      defaultCardConfig.color = "violet";
      break;
    case "kpi-capacity-used":
      defaultCardConfig.collection = "sessions";
      defaultCardConfig.operation = "percentage";
      defaultCardConfig.filterField = "status";
      defaultCardConfig.filterOperator = "equals";
      defaultCardConfig.filterValue = "active";
      defaultCardConfig.icon = "BarChart2";
      defaultCardConfig.color = "blue";
      break;
    case "kpi-growth-rate":
      defaultCardConfig.collection = "contacts";
      defaultCardConfig.operation = "count";
      defaultCardConfig.filterField = "";
      defaultCardConfig.icon = "TrendingUp";
      defaultCardConfig.color = "emerald";
      break;
    case "kpi-whatsapp-verified":
      defaultCardConfig.collection = "contacts";
      defaultCardConfig.operation = "percentage";
      defaultCardConfig.filterField = "whatsappStatus";
      defaultCardConfig.filterOperator = "equals";
      defaultCardConfig.filterValue = "REGISTERED";
      defaultCardConfig.icon = "MessageCircle";
      defaultCardConfig.color = "amber";
      break;
    case "kpi-active-contacts":
      defaultCardConfig.collection = "contacts";
      defaultCardConfig.operation = "percentage";
      defaultCardConfig.filterField = "isActive";
      defaultCardConfig.filterOperator = "equals";
      defaultCardConfig.filterValue = "true";
      defaultCardConfig.icon = "UserCheck";
      defaultCardConfig.color = "green";
      break;
    case "kpi-total-contacts":
      defaultCardConfig.collection = "contacts";
      defaultCardConfig.operation = "count";
      defaultCardConfig.filterField = "";
      defaultCardConfig.icon = "Users";
      defaultCardConfig.color = "blue";
      break;
    case "kpi-total-questions":
      defaultCardConfig.collection = "questions";
      defaultCardConfig.operation = "count";
      defaultCardConfig.filterField = "";
      defaultCardConfig.icon = "BarChart2";
      defaultCardConfig.color = "blue";
      break;
    case "kpi-generated-tests":
      defaultCardConfig.collection = "tests";
      defaultCardConfig.operation = "count";
      defaultCardConfig.filterField = "";
      defaultCardConfig.icon = "CalendarCheck";
      defaultCardConfig.color = "blue";
      break;
    case "kpi-test-submissions":
      defaultCardConfig.collection = "assessment_results";
      defaultCardConfig.operation = "count";
      defaultCardConfig.filterField = "";
      defaultCardConfig.icon = "UserCheck";
      defaultCardConfig.color = "violet";
      break;
    case "kpi-avg-test-score":
      defaultCardConfig.collection = "assessment_results";
      defaultCardConfig.operation = "percentage";
      defaultCardConfig.filterField = "";
      defaultCardConfig.icon = "Target";
      defaultCardConfig.color = "green";
      break;
    case "kpi-total-faculty":
      defaultCardConfig.collection = "teachers";
      defaultCardConfig.operation = "count";
      defaultCardConfig.filterField = "status";
      defaultCardConfig.filterOperator = "equals";
      defaultCardConfig.filterValue = "active";
      defaultCardConfig.icon = "GraduationCap";
      defaultCardConfig.color = "primary";
      break;
    case "kpi-on-leave":
      defaultCardConfig.collection = "teachers";
      defaultCardConfig.operation = "count";
      defaultCardConfig.filterField = "status";
      defaultCardConfig.filterOperator = "equals";
      defaultCardConfig.filterValue = "on_leave";
      defaultCardConfig.icon = "Activity";
      defaultCardConfig.color = "amber";
      break;
  }

  return defaultCardConfig;
}

export default function KPISummary({ category, role }: KPISummaryProps): React.JSX.Element {
  const { can } = usePermissions();
  const { t } = useTranslation();
  const { activeCurrency } = useFinanceCurrency();
  const isContactsCategory = category === "contacts";
  const isStudentsCategory = category === "students";
  const isTeachersCategory = category === "teachers" || category === "faculty";
  const needsContactAnalytics = isContactsCategory || category === "students" || category === "sessions";
  const { data: contactsReportData } = useContactsReportAnalytics({ enabled: needsContactAnalytics });
  const { data: studentMetrics } = useStudentsMetrics({ enabled: isStudentsCategory || category === "enrollments" });
  const { data: teacherMetrics } = useTeachersMetrics({ enabled: isTeachersCategory || category === "enrollments" });
  const { data: crossStudentMetrics } = useStudentsMetrics({
    enabled: !isStudentsCategory && !isContactsCategory && !isTeachersCategory && category !== "enrollments",
  });
  const { data: crossTeacherMetrics } = useTeachersMetrics({ enabled: !isTeachersCategory && category !== "enrollments" });
  const contactAnalytics = contactsReportData?.analytics;
  const auxiliaryStudentMetrics = category === "enrollments" ? studentMetrics : crossStudentMetrics;
  const auxiliaryTeacherMetrics = category === "enrollments" ? teacherMetrics : crossTeacherMetrics;
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

  const computedKPIs = useMemo(() => {
    // 1. Total Students
    let totalStudentsVal = "0";
    let totalStudentsSub = t("reports.kpi.sub.noStudents");
    let totalStudentsTrend: "up" | "down" | "flat" = "flat";
    let totalStudentsVelocity = undefined;

    if (category === "contacts" && contactAnalytics) {
      totalStudentsVal = String(contactAnalytics.total);
      totalStudentsSub = t("reports.kpi.sub.newRecentlyCount", { count: contactAnalytics.newLast30Days });
      totalStudentsTrend = contactAnalytics.newLast30Days >= contactAnalytics.newPrior30Days ? "up" : "down";
      totalStudentsVelocity =
        contactAnalytics.newPrior30Days > 0
          ? `${Math.round(((contactAnalytics.newLast30Days - contactAnalytics.newPrior30Days) / contactAnalytics.newPrior30Days) * 100)}%`
          : `+${contactAnalytics.newLast30Days}`;
    } else if (category === "contacts") {
      totalStudentsVal = "0";
      totalStudentsSub = t("reports.kpi.sub.noContacts");
    } else if (isStudentsCategory && studentMetrics) {
      totalStudentsVal = String(studentMetrics.total);
      totalStudentsSub = t("reports.kpi.sub.activeNow", { count: studentMetrics.active });
      totalStudentsTrend = studentMetrics.newThisPeriod > 0 ? "up" : "flat";
    } else {
      const metrics = category === "enrollments" ? studentMetrics : crossStudentMetrics;
      totalStudentsVal = String(metrics?.total ?? 0);
      totalStudentsSub = t("reports.kpi.sub.activeNow", { count: metrics?.active ?? 0 });
      totalStudentsTrend = (metrics?.newThisPeriod ?? 0) > 0 ? "up" : "flat";
    }

    // 2. Avg Attendance
    const presentAttendanceCount = attendanceRecords.filter((attendanceRecord) => attendanceRecord.status === "present" || attendanceRecord.status === "late").length;
    const attendanceRate = attendanceRecords.length > 0 ? Math.round((presentAttendanceCount / attendanceRecords.length) * 100) : 0;
    const averageAttendanceValue = `${attendanceRate}%`;
    const averageAttendanceTrend = attendanceRate > 85 ? "up" : "flat";

    // 3. Fee Collected
    const collected = invoices.filter((invoice) => invoice.status === "paid").reduce((sum, invoice) => sum + invoice.finalAmt, 0);
    const feeCollectedVal = `${activeCurrency.code} ${(collected/1000).toFixed(1)}k`;

    // 4. Outstanding
    const outstanding = invoices.filter((invoice) => invoice.status !== "paid" && invoice.status !== "cancelled").reduce((sum, invoice) => sum + (invoice.finalAmt - (invoice.paidAmt || 0)), 0);
    const outstandingCount = invoices.filter((invoice) => invoice.status !== "paid" && invoice.status !== "cancelled").length;
    const outstandingVal = `${activeCurrency.code} ${(outstanding/1000).toFixed(1)}k`;
    const outstandingSub = t("reports.kpi.sub.invoiceCount", { count: outstandingCount });

    // 5. Hasanat Awarded
    const totalHasanat = distributions.reduce((sum, distribution) => {
      const denominationName = (distribution.denominationName || "").toLowerCase();
      const matchedDenomination = denominations.find((denomination) => denomination.id === distribution.denominationId);
      const points = matchedDenomination ? matchedDenomination.points : (
        denominationName.includes("silver") ? 150 :
        denominationName.includes("gold") ? 500 :
        denominationName.includes("platinum") ? 1000 :
        denominationName.includes("diamond") ? 2500 : 50
      );
      return sum + (distribution.quantity || 1) * points;
    }, 0);
    const hasanatVal = formatNumber(totalHasanat);

    // 6. Pass Rate

    let passesCount = 0;
    let totalResultsCount = 0;
    examResults.forEach((examResult) => {
      const exam = exams.find((examOption) => examOption.id === examResult.examId);
      if (exam) {
        totalResultsCount++;
        if (examResult.marksObtained >= exam.passingMarks) {
          passesCount++;
        }
      }
    });
    const passRate = totalResultsCount > 0 ? Math.round((passesCount / totalResultsCount) * 100) : 0;
    const passRateVal = `${passRate}%`;

    // Question bank metrics
    const questionBankQuestionCount = questionBankQuestions.length;
    const questionBankTestCount = questionBankTests.length;
    const questionBankSubmissionCount = questionBankResults.length;
    let questionBankTotalObtained = 0;
    let questionBankTotalMax = 0;
    questionBankResults.forEach((questionBankResult: QuestionBankResult) => {
      const test = questionBankTests.find((questionBankTest: QuestionBankTest) => questionBankTest.id === questionBankResult.testId);
      if (!test) return;
      const obtained = Object.values(questionBankResult.scores).reduce((sum: number, score) => sum + (score as number), 0);
      const max = test.questionIds.reduce((sum: number, questionId: string) => {
        const question = questionBankQuestions.find((questionBankQuestion: QuestionBankQuestion) => questionBankQuestion.id === questionId);
        return sum + (question?.marks ?? 0);
      }, 0);
      questionBankTotalObtained += obtained;
      questionBankTotalMax += max;
    });
    const questionBankAverageScoreValue =
      questionBankTotalMax > 0 ? `${Math.round((questionBankTotalObtained / questionBankTotalMax) * 100)}%` : "0%";

    // 7. Capacity Used
    const activeSessionsList = sessions.filter((session) => session.status === "active");
    const classesList = activeSessionsList.flatMap((session) => session.classes || []);
    const enrolledSum = classesList.reduce((sum, sessionClass) => sum + (sessionClass.enrolled || 0), 0);
    const capacitySum = classesList.reduce((sum, sessionClass) => sum + (sessionClass.capacity || 0), 0);
    const capacityUsed = capacitySum > 0 ? Math.round((enrolledSum / capacitySum) * 100) : 0;
    const capacityVal = `${capacityUsed}%`;
    const capacitySub = t("reports.kpi.sub.acrossClasses", { count: classesList.length });

    // 8. Growth Rate
    let growthVal = "+0%";
    let growthTrend: "up" | "down" | "flat" = "flat";
    let growthSub = t("reports.kpi.sub.noSignupDates");
    if (needsContactAnalytics && contactAnalytics?.hasSignupDates) {
      const recentSignups = contactAnalytics.growthRecentSignups30d;
      const priorSignups = contactAnalytics.growthPriorSignups30d;
      if (priorSignups === 0) {
        growthVal = recentSignups > 0 ? `+${recentSignups * 100}%` : "0%";
        growthTrend = recentSignups > 0 ? "up" : "flat";
        growthSub = t("reports.kpi.sub.growthNewLast30d", { count: recentSignups });
      } else {
        const percentage = Math.round(((recentSignups - priorSignups) / priorSignups) * 100);
        growthVal = `${percentage >= 0 ? "+" : ""}${percentage}%`;
        growthTrend = percentage > 0 ? "up" : (percentage < 0 ? "down" : "flat");
        growthSub = t("reports.kpi.sub.growthVsPrevious", { recent: recentSignups, prior: priorSignups });
      }
    } else if (needsContactAnalytics && contactAnalytics) {
      growthSub = t("reports.kpi.sub.noSignupDates");
    }

    const contactsRecent30 = contactAnalytics?.newThisPeriod ?? 0;

    const kpiItems: (KPIItem & { categories: string[] })[] = [
      {
        id: "kpi-total-students",
        icon: Users,
        label: t("reports.kpi.totalStudents"),
        value: totalStudentsVal,
        sub: totalStudentsSub,
        color: "primary",
        trend: totalStudentsTrend,
        velocity: totalStudentsVelocity,
        categories: ["students", "enrollments"],
        isAvailable: category === "contacts"
          ? (contactAnalytics?.total ?? 0) > 0
          : isStudentsCategory
            ? (studentMetrics?.total ?? 0) > 0
            : (auxiliaryStudentMetrics?.total ?? 0) > 0
      },
      {
        id: "kpi-avg-attendance",
        icon: UserCheck,
        label: t("reports.kpi.avgAttendance"),
        value: averageAttendanceValue,
        sub: t("reports.kpi.sub.last30Days"),
        color: "green",
        trend: averageAttendanceTrend,
        categories: ["attendance"],
        isAvailable: attendanceRecords.length > 0
      },
      {
        id: "kpi-fee-collected",
        icon: DollarSign,
        label: t("reports.kpi.feeCollected"),
        value: feeCollectedVal,
        sub: t("reports.kpi.sub.allTimeTotal"),
        color: "blue",
        trend: "up",
        categories: ["financial", "accounting"],
        isAvailable: invoices.some((invoice) => invoice.status === "paid")
      },
      {
        id: "kpi-outstanding",
        icon: AlertCircle,
        label: t("reports.kpi.outstanding"),
        value: outstandingVal,
        sub: outstandingSub,
        color: "red",
        trend: "down",
        categories: ["financial", "accounting"],
        isAvailable: invoices.some((invoice) => invoice.status !== "paid" && invoice.status !== "cancelled")
      },
      {
        id: "kpi-hasanat-awarded",
        icon: Star,
        label: t("reports.kpi.hasanatAwarded"),
        value: hasanatVal,
        sub: t("reports.kpi.sub.allStudents"),
        color: "amber",
        trend: "up",
        categories: ["hasanat"],
        isAvailable: distributions.length > 0
      },
      {
        id: "kpi-pass-rate",
        icon: GraduationCap,
        label: t("reports.kpi.passRate"),
        value: passRateVal,
        sub: t("reports.kpi.sub.lastExamCycle"),
        color: "violet",
        trend: "flat",
        categories: ["examinations", "students"],
        isAvailable: examResults.length > 0 && exams.length > 0
      },
      {
        id: "kpi-capacity-used",
        icon: BarChart2,
        label: t("reports.kpi.capacityUsed"),
        value: capacityVal,
        sub: capacitySub,
        color: "primary",
        trend: "up",
        categories: ["sessions", "enrollments"],
        isAvailable: sessions.length > 0
      },
      {
        id: "kpi-growth-rate",
        icon: TrendingUp,
        label: t("reports.kpi.growthRate"),
        value: growthVal,
        sub: growthSub,
        color: "green",
        trend: growthTrend,
        categories: ["students", "sessions"],
        isAvailable: needsContactAnalytics ? Boolean(contactAnalytics?.hasSignupDates) : false
      },
      {
        id: "kpi-whatsapp-verified",
        icon: MessageCircle,
        label: t("reports.contacts.kpi.whatsappVerified"),
        value: contactAnalytics ? `${contactAnalytics.whatsappRate}%` : "0%",
        sub: t("reports.contacts.kpi.whatsappSub"),
        color: "amber",
        trend: "flat",
        categories: ["contacts"],
        isAvailable: (contactAnalytics?.total ?? 0) > 0
      },
      {
        id: "kpi-active-contacts",
        icon: UserCheck,
        label: t("reports.contacts.kpi.activeContacts"),
        value: contactAnalytics ? String(contactAnalytics.activeCount) : "0",
        sub: t("reports.contacts.kpi.activeContactsSub"),
        color: "green",
        trend: "flat",
        categories: ["contacts"],
        isAvailable: (contactAnalytics?.total ?? 0) > 0
      },
      {
        id: "kpi-total-contacts",
        icon: Users,
        label: t("reports.contacts.kpi.totalContacts"),
        value: contactAnalytics ? String(contactAnalytics.total) : "0",
        sub: t("reports.contacts.kpi.newRecently", { count: contactsRecent30 }),
        color: "primary",
        trend: contactsRecent30 > 0 ? "up" : "flat",
        categories: ["contacts"],
        isAvailable: (contactAnalytics?.total ?? 0) > 0
      },
      {
        id: "kpi-total-questions",
        icon: BarChart2,
        label: t("reports.kpi.totalQuestions"),
        value: String(questionBankQuestionCount),
        sub: t("reports.kpi.sub.inQuestionBank"),
        color: "primary",
        trend: "up",
        categories: ["questionBank"],
        isAvailable: questionBankQuestionCount > 0,
      },
      {
        id: "kpi-generated-tests",
        icon: CalendarCheck,
        label: t("reports.kpi.generatedTests"),
        value: String(questionBankTestCount),
        sub: t("reports.kpi.sub.autoBuiltPapers"),
        color: "blue",
        trend: "flat",
        categories: ["questionBank"],
        isAvailable: questionBankTestCount > 0,
      },
      {
        id: "kpi-test-submissions",
        icon: UserCheck,
        label: t("reports.kpi.testSubmissions"),
        value: String(questionBankSubmissionCount),
        sub: t("reports.kpi.sub.gradedAttempts"),
        color: "violet",
        trend: "up",
        categories: ["questionBank"],
        isAvailable: questionBankSubmissionCount > 0,
      },
      {
        id: "kpi-avg-test-score",
        icon: Target,
        label: t("reports.kpi.avgTestScore"),
        value: questionBankAverageScoreValue,
        sub: t("reports.kpi.sub.acrossSubmissions"),
        color: "green",
        trend: "flat",
        categories: ["questionBank"],
        isAvailable: questionBankSubmissionCount > 0 && questionBankTotalMax > 0,
      },
      {
        id: "kpi-total-faculty",
        icon: GraduationCap,
        label: t("reports.kpi.totalFaculty"),
        value: String(isTeachersCategory ? (teacherMetrics?.total ?? 0) : (auxiliaryTeacherMetrics?.total ?? 0)),
        sub: t("reports.kpi.sub.activeCount", { count: isTeachersCategory ? (teacherMetrics?.active ?? 0) : (auxiliaryTeacherMetrics?.active ?? 0) }),
        color: "primary",
        trend: "flat",
        categories: ["teachers", "faculty"],
        isAvailable: isTeachersCategory
          ? (teacherMetrics?.total ?? 0) > 0
          : (auxiliaryTeacherMetrics?.total ?? 0) > 0,
      },
      {
        id: "kpi-on-leave",
        icon: Activity,
        label: t("reports.kpi.onLeave"),
        value: String(isTeachersCategory ? (teacherMetrics?.onLeave ?? 0) : (auxiliaryTeacherMetrics?.onLeave ?? 0)),
        sub: t("reports.kpi.sub.facultyOnLeave"),
        color: "amber",
        trend: "flat",
        categories: ["teachers", "faculty"],
        isAvailable: isTeachersCategory
          ? (teacherMetrics?.onLeave ?? 0) > 0
          : (auxiliaryTeacherMetrics?.onLeave ?? 0) > 0,
      },
    ];

    return kpiItems;
  }, [contactAnalytics, attendanceRecords, invoices, exams, examResults, sessions, distributions, questionBankQuestions, questionBankTests, questionBankResults, category, studentMetrics, isStudentsCategory, teacherMetrics, isTeachersCategory, auxiliaryStudentMetrics, auxiliaryTeacherMetrics, needsContactAnalytics, crossStudentMetrics, denominations, t, activeCurrency.code]);

  // Determine standard possible cards for this category and user role
  const standardPossibleCards = useMemo(() => {
    return computedKPIs.filter((k) => {
      const isInCategory = k.categories.includes(category);
      if (!isInCategory) return false;

      if (can("attendance.write") && !can("finance.write")) {
        return KPI_ROLE_ATTENDANCE_ONLY_IDS.includes(k.id);
      }
      if (can("finance.write") && !can("attendance.write")) {
        return KPI_ROLE_FINANCE_ONLY_IDS.includes(k.id);
      }
      return true;
    });
  }, [computedKPIs, category, can]);

  // Load custom cards for this category
  const [customCards, setCustomCards] = useState<CustomCard[]>(() => {
    return getObject<CustomCard[]>(`kpi_custom_cards_${category}`, []);
  });

  const customCardWidgetInputs = useMemo(() => {
    return customCards.map((card) => ({
      id: card.id,
      collection: card.collection,
      operation: card.operation,
      targetField: card.targetField,
      filterField: card.filterField,
      filterOperator: card.filterOperator,
      filterValue: card.filterValue,
    }));
  }, [customCards]);

  const hasContactCustomCards = customCards.some((card) => card.collection === "contacts");
  const hasStudentCustomCards = customCards.some((card) => card.collection === "students");
  const hasTeacherCustomCards = customCards.some((card) => card.collection === "teachers");

  const { data: contactWidgetAggregates } = useContactsWidgetAggregates(
    customCardWidgetInputs,
    { enabled: isContactsCategory && hasContactCustomCards },
  );

  const { data: studentWidgetAggregates } = useStudentsWidgetAggregates(
    customCardWidgetInputs,
    { enabled: isStudentsCategory && hasStudentCustomCards },
  );

  const { data: teacherWidgetAggregates } = useTeachersWidgetAggregates(
    customCardWidgetInputs,
    { enabled: isTeachersCategory && hasTeacherCustomCards },
  );

  const defaultCollection = useMemo<CustomCard["collection"]>(() => {
    if (category === "students") return "students";
    if (category === "contacts") return "contacts";
    if (category === "attendance") return "attendance_records";
    if (category === "financial" || category === "accounting") return "finance_invoices";
    if (category === "hasanat") return "hasanat_distributions";
    if (category === "sessions") return "sessions";
    if (category === "examinations" || category === "enrollments") return "students";
    if (category === "questionBank") return "questions";
    if (category === "teachers" || category === "faculty") return "teachers";
    return "students";
  }, [category]);

  // Card builder form state
  const [editingCardConfig, setEditingCardConfig] = useState<CustomCard | null>(null);

  // Sync custom cards from localStorage when updated elsewhere
  useEffect(() => {
    const handleUpdate = () => {
      const nextCards = getObject<CustomCard[]>(`kpi_custom_cards_${category}`, []);
      setCustomCards((previousCards) => areCustomCardsEqual(previousCards, nextCards) ? previousCards : nextCards);
    };
    window.addEventListener("local-database-update", handleUpdate);
    return () => window.removeEventListener("local-database-update", handleUpdate);
  }, [category]);

  // Sync default collection on category change
  useEffect(() => {
    setEditingCardConfig(null);
  }, [category]);

  // Compute custom KPI items
  const computedCustomKPIs = useMemo(() => {
    return customCards.map((card) => {
      if (card.collection === "contacts") {
        const aggregate = contactWidgetAggregates?.[card.id];
        if (aggregate) {
          const aggregateValue = formatAggregateCardValue(card, aggregate);
          return {
            id: card.id,
            label: resolveWidgetTitle(card, t),
            value: String(aggregateValue.finalValue),
            sub: resolveWidgetSubText(card, t) || t('reports.widgets.totalCountText', { count: aggregateValue.totalCount }),
            icon: (ICONS[card.icon] || Users) as LucideIcon,
            color: (card.color === "emerald" ? "green" : card.color) as KPIItem["color"],
            trend: "flat" as const,
            isAvailable: aggregateValue.totalCount > 0,
            categories: [category],
          };
        }
      }
      if (card.collection === "students") {
        const aggregate = studentWidgetAggregates?.[card.id];
        if (aggregate) {
          const aggregateValue = formatAggregateCardValue(card, aggregate);
          return {
            id: card.id,
            label: resolveWidgetTitle(card, t),
            value: String(aggregateValue.finalValue),
            sub: resolveWidgetSubText(card, t) || t('reports.widgets.totalCountText', { count: aggregateValue.totalCount }),
            icon: (ICONS[card.icon] || Users) as LucideIcon,
            color: (card.color === "emerald" ? "green" : card.color) as KPIItem["color"],
            trend: "flat" as const,
            isAvailable: aggregateValue.totalCount > 0,
            categories: [category],
          };
        }
      }
      if (card.collection === "teachers") {
        const aggregate = teacherWidgetAggregates?.[card.id];
        if (aggregate) {
          const aggregateValue = formatAggregateCardValue(card, aggregate);
          return {
            id: card.id,
            label: resolveWidgetTitle(card, t),
            value: String(aggregateValue.finalValue),
            sub: resolveWidgetSubText(card, t) || t('reports.widgets.totalCountText', { count: aggregateValue.totalCount }),
            icon: (ICONS[card.icon] || Users) as LucideIcon,
            color: (card.color === "emerald" ? "green" : card.color) as KPIItem["color"],
            trend: "flat" as const,
            isAvailable: aggregateValue.totalCount > 0,
            categories: [category],
          };
        }
      }
      return computeCustomCard(card, {
        students: [],
        teachers: [],
        sessions,
        finance_invoices: invoices,
        attendance_records: attendanceRecords,
        hasanat_distributions: distributions,
        hasanat_denoms: denominations,
        contacts: [],
        questions: questionBankQuestions,
        tests: questionBankTests,
        assessment_results: questionBankResults,
      }, t);
    });
  }, [
    customCards,
    category,
    contactWidgetAggregates,
    studentWidgetAggregates,
    teacherWidgetAggregates,
    sessions,
    invoices,
    attendanceRecords,
    distributions,
    denominations,
    questionBankQuestions,
    questionBankTests,
    questionBankResults,
    t,
  ]);

  // Merge standard and custom possible cards, preventing duplicates if standard card is overridden
  const possibleCards = useMemo(() => {
    const customCardIds = new Set(computedCustomKPIs.map((card) => card.id));
    const uniqueStandard = standardPossibleCards.filter((card) => !customCardIds.has(card.id));
    return [...uniqueStandard, ...computedCustomKPIs];
  }, [standardPossibleCards, computedCustomKPIs]);

  const availableCardIdsKey = useMemo(() => {
    return possibleCards
      .filter((card) => card.isAvailable)
      .map((card) => card.id)
      .join("\u0000");
  }, [possibleCards]);

  // Primary volume counts for the dynamic limit formula
  const primaryVolume = useMemo(() => {
    switch (category) {
      case "students": return studentMetrics?.total ?? 0;
      case "contacts": return contactAnalytics?.total ?? 0;
      case "attendance": return attendanceRecords.length;
      case "financial":
      case "accounting":
        return invoices.length;
      case "hasanat": return distributions.length;
      case "sessions": return sessions.length;
      case "examinations":
        return examResults.length + exams.length;
      case "questionBank":
        return questionBankQuestions.length + questionBankTests.length + questionBankResults.length;
      case "enrollments":
        return (studentMetrics?.total ?? 0) + sessions.length;
      case "teachers":
      case "faculty":
        return teacherMetrics?.total ?? 0;
      default:
        return 0;
    }
  }, [category, contactAnalytics, studentMetrics, teacherMetrics, attendanceRecords, invoices, distributions, examResults, exams, sessions, questionBankQuestions, questionBankTests, questionBankResults]);

  // User-configurable active visibility controls state
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>(() => {
    return getObject<string[]>(`kpi_config_${category}_${role || "all"}`, []);
  });

  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Validate user selections reactively against database changes
  useEffect(() => {
    const availableCards = possibleCards.filter((card) => card.isAvailable);
    const availableCardIds = availableCardIdsKey ? availableCardIdsKey.split("\u0000") : [];
    const selectedIds = normalizeStoredCardIds(selectedCardIds, availableCards);
    let validSelectedCardIds = selectedIds.filter((cardId) => availableCardIds.includes(cardId));

    // Default to all available cards if no active selection is stored
    if (validSelectedCardIds.length === 0 && availableCardIds.length > 0) {
      validSelectedCardIds = availableCardIds;
    }

    if (areStringListsEqual(selectedCardIds, validSelectedCardIds)) return;

    saveObject(`kpi_config_${category}_${role || "all"}`, validSelectedCardIds);
    setSelectedCardIds(validSelectedCardIds);
  }, [availableCardIdsKey, category, role, selectedCardIds, possibleCards]);

  const handleToggleCard = (cardId: string) => {
    setSelectedCardIds((previousCardIds) => {
      let nextSelectedCardIds: string[];
      if (previousCardIds.includes(cardId)) {
        nextSelectedCardIds = previousCardIds.filter((selectedCardId) => selectedCardId !== cardId);
      } else {
        nextSelectedCardIds = [...previousCardIds, cardId];
      }
      saveObject(`kpi_config_${category}_${role || "all"}`, nextSelectedCardIds);
      return nextSelectedCardIds;
    });
  };

  // Automatically select newly added custom cards so they are visible immediately
  const prevCustomIdsRef = useRef<string[]>(getObject<string[]>(`prev_kpi_ids_${category}`, []));
  const prevCustomIdsCategoryRef = useRef(category);
  useEffect(() => {
    if (prevCustomIdsCategoryRef.current !== category) {
      prevCustomIdsCategoryRef.current = category;
      prevCustomIdsRef.current = getObject<string[]>(`prev_kpi_ids_${category}`, []);
    }

    const currentIds = customCards.map((card) => card.id);
    const prevIds = prevCustomIdsRef.current;
    const newlyAdded = currentIds.filter((id) => !prevIds.includes(id));
    prevCustomIdsRef.current = currentIds;
    saveObject(`prev_kpi_ids_${category}`, currentIds);
    if (newlyAdded.length > 0) {
      const nextSelectedCardIds = [...new Set([...selectedCardIds, ...newlyAdded])];
      if (areStringListsEqual(selectedCardIds, nextSelectedCardIds)) return;

      saveObject(`kpi_config_${category}_${role || "all"}`, nextSelectedCardIds);
      setSelectedCardIds(nextSelectedCardIds);
    }
  }, [customCards, category, role, selectedCardIds]);

  const handleDeleteCustomCard = (cardId: string) => {
    const updatedCards = customCards.filter((card) => card.id !== cardId);
    setCustomCards(updatedCards);
    saveObject(`kpi_custom_cards_${category}`, updatedCards);
    
    const nextSelected = selectedCardIds.filter((selectedCardId) => selectedCardId !== cardId);
    setSelectedCardIds(nextSelected);
    saveObject(`kpi_config_${category}_${role || "all"}`, nextSelected);

    if (editingCardConfig && editingCardConfig.id === cardId) {
      setEditingCardConfig(null);
    }
    
    window.dispatchEvent(new Event("local-database-update"));
  };

  const handleEditCard = (card: KPIItem) => {
    const customCard = customCards.find((savedCard) => savedCard.id === card.id);
    if (customCard) {
      setEditingCardConfig(customCard);
    } else {
      const defaultCardConfig = getDefaultCardConfig(
        category,
        card.id,
        card.label,
        KPI_TITLE_KEYS[card.id],
      );
      setEditingCardConfig({
        ...defaultCardConfig,
        id: `edit-default-${card.id}-${Date.now()}`,
      });
    }

    const configPanel = document.getElementById(`config-panel-${category}`);
    if (configPanel) configPanel.scrollIntoView({ behavior: "smooth" });
  };

  const visible = possibleCards.filter((card) => selectedCardIds.includes(card.id));

  const getCategoryLabelKey = (categoryName: string): string => {
    switch (categoryName) {
      case "contacts": return "nav.contacts";
      case "students": return "nav.students";
      case "attendance": return "nav.attendance";
      case "financial": return "nav.finance";
      case "hasanat": return "nav.hasanatCards";
      case "sessions": return "nav.sessions";
      case "examinations": return "nav.examinations";
      case "questionBank": return "nav.questionBank";
      case "enrollments": return "nav.enrollments";
      case "faculty":
      case "teachers": return "nav.teachers";
      case "accounting": return "nav.accounting";
      default: return "";
    }
  };

  const categoryLabelKey = getCategoryLabelKey(category);
  const moduleLabel = categoryLabelKey ? t(categoryLabelKey as AppTranslationKey) : category;

  return (
    <div className="space-y-3 w-full">
      {/* Configuration Header Bar */}
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold text-muted-foreground uppercase tracking-widest leading-none">
          {t("reports.kpiSectionTitle", { module: moduleLabel })}
        </span>
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsConfigOpen(!isConfigOpen)}
          className="min-h-11 flex items-center gap-1.5 px-2.5 rounded-lg border border-border bg-card/60 backdrop-blur-md hover:bg-card hover:text-primary text-muted-foreground font-semibold shadow-sm"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
          {t("reports.kpiCustomize")}
        </Button>
      </div>

      {/* Glassmorphic Settings Panel */}
      <AnimatePresence>
        {isConfigOpen && (
          <motion.div
            id={`config-panel-${category}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden rounded-2xl border border-border bg-card/40 backdrop-blur-lg p-4 space-y-4 font-sans"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-border">
              <div>
                <h4 className="text-sm font-bold text-foreground">{t("reports.kpiSettingsTitle")}</h4>
                <p className="text-[11px] text-muted-foreground">
                  {t("reports.kpiSettingsDesc")}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  status="selected"
                  size="sm"
                  config={{ selected: { label: t("reports.kpiSelectedCount", { count: selectedCardIds.length }), cls: SEMANTIC_BADGE.success } }}
                />
                <StatusBadge
                  status="volume"
                  size="sm"
                  config={{ volume: { label: t("reports.kpiDataVolume", { count: primaryVolume }), cls: "bg-primary/10 text-primary border-primary/20" } }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-border">
              
              {/* Reusable State-of-the-Art Creator Form */}
              <div className="lg:col-span-2">
                <DynamicCardBuilder 
                  mode="kpi" 
                  category={category} 
                  initialCollection={defaultCollection}
                  editCardConfig={editingCardConfig}
                  onCancelEdit={() => setEditingCardConfig(null)}
                />
              </div>

              {/* Settings Checklist Column (1/3 width) */}
              <div className="rounded-2xl border border-border/50 bg-card/25 p-5 shadow-inner space-y-4 text-left flex flex-col justify-between">
                <div>
                  <div className="pb-2 border-b border-border">
                    <h4 className="text-xs font-black text-foreground uppercase tracking-widest leading-none">{t("reports.kpiVisibility")}</h4>
                  </div>

                  <p className="text-[10px] text-muted-foreground mt-1.5 font-sans">
                    {t("reports.kpiVisibilityDesc")}
                  </p>

                  <div className="space-y-1.5 mt-3 max-h-[320px] overflow-y-auto pr-1">
                    {possibleCards.map((kpi) => {
                      const isSelected = selectedCardIds.includes(kpi.id);
                      const isCustom = customCards.some((c) => c.id === kpi.id);

                      return (
                        <div
                          key={kpi.id}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-border/40 bg-card/10 hover:bg-card/20 transition-all font-sans"
                        >
                          <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleToggleCard(kpi.id)}
                              className="w-3.5 h-3.5"
                              aria-label={kpi.label}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-foreground truncate leading-tight">
                                {kpi.label}
                              </p>
                              <p className="text-[9px] text-muted-foreground leading-none mt-0.5 flex items-center gap-1 font-semibold">
                                {isCustom ? (
                                  <span className="text-primary">{t("reports.kpiCustomCard")}</span>
                                ) : (
                                  <span className="text-success">{t("reports.kpiActiveData")}</span>
                                )}
                              </p>
                            </div>
                          </label>

                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              onClick={() => handleEditCard(kpi)}
                              className="rounded hover:bg-primary/10 text-muted-foreground hover:text-primary shadow-none"
                              title={t("reports.kpiEditConfig")}
                              type="button"
                              variant="ghost"
                              size="icon"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
                            </Button>

                            {isCustom && (
                              <Button
                                onClick={() => handleDeleteCustomCard(kpi.id)}
                                className="rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive shadow-none"
                                title={t("reports.kpiDeleteConfig")}
                                type="button"
                                variant="ghost"
                                size="icon"
                              >
                                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t border-border mt-3">
                  <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground">
                    <span>{t("reports.kpiActiveSelection")}</span>
                    <span className="text-foreground">{t("reports.kpiSelectionRatio", { current: selectedCardIds.length, total: possibleCards.length })}</span>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 font-sans">
        {visible.map((kpi, i: number) => {
          const kpiColor = COLOR[kpi.color] || COLOR.primary;
          const trendInfo = TREND[kpi.trend] || TREND.flat;
          const Icon = kpi.icon;

          return (
            <motion.article
              key={kpi.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl border border-border bg-card/60 backdrop-blur-md p-3.5 flex flex-col justify-between text-left shadow-sm hover:shadow-md hover:border-primary/20 transition-all group min-h-[120px]"
            >
              {/* Header Zone: Icon */}
              <header className="flex items-center justify-between gap-1.5 select-none">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center aspect-square flex-shrink-0 ${kpiColor.bg} group-hover:scale-115 transition-transform`}>
                  <Icon className={`w-4 h-4 ${kpiColor.text}`} />
                </div>
              </header>

              {/* Main Zone: Title and Statistical value */}
              <main className="mt-2 space-y-0.5 flex-1 min-w-0">
                <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none truncate">
                  {kpi.label}
                </span>
                <p className={`text-lg font-black ${kpiColor.text} leading-tight mt-0.5 truncate`}>
                  {kpi.value}
                </p>
              </main>

              {/* Footer Zone: Subtitle metadata and trend arrow */}
              <footer className="mt-2 pt-1.5 border-t border-border/20 text-[9px] text-muted-foreground min-w-0">
                <div className="flex items-center gap-1 font-sans mb-0.5 select-none">
                  <span className={`text-[9px] font-black ${trendInfo.cls}`}>{trendInfo.arrow} {kpi.velocity || ""}</span>
                  {kpi.velocity && <span className="text-[8px] text-muted-foreground font-medium opacity-60">{t("reports.kpiVsPrev")}</span>}
                </div>
                <SubtextDisplay text={kpi.sub} />
              </footer>
            </motion.article>
          );
        })}

        {/* Add Custom Metric card */}
        <motion.button
          onClick={() => {
            setIsConfigOpen(true);
            setTimeout(() => {
              const configPanel = document.getElementById(`config-panel-${category}`);
              if (configPanel) configPanel.scrollIntoView({ behavior: "smooth" });
            }, 100);
          }}
          className="rounded-2xl border border-dashed border-border/85 hover:border-primary/50 bg-card/25 hover:bg-primary/5 hover:text-primary transition-all duration-300 flex flex-col items-center justify-center p-3 text-muted-foreground min-h-[100px] text-center cursor-pointer"
        >
          <Plus className="w-5 h-5 mb-1 text-muted-foreground hover:text-primary" />
          <span className="text-[10px] font-bold">{t("reports.kpiAddCustom")}</span>
        </motion.button>
      </div>
    </div>
  );
}

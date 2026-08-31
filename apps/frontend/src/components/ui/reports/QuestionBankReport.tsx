import React, { lazy, Suspense, useMemo, useState } from 'react';
import { BarChart2, CheckCircle, TrendingUp } from 'lucide-react';
import { getQuestionCategoryIds } from "@mms/shared";
import {
  useQuestionBankQuestions,
  useQuestionBankQuestionsCollection,
  useQuestionBankTests,
  useQuestionBankTestsCollection,
  useQuestionBankResults,
  useQuestionBankResultsCollection,
  useQuestionBankReportAggregates,
  useQuestionBankConfig,
} from "@/tenant/hooks/collections/questionBank";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { SubTabBar, type SubTab } from "@/components/ui/SubTabBar";
import { AutoGrading } from "@/tenant/features/question-bank/components/AutoGrading";
import { PerformanceAnalytics } from "@/tenant/features/question-bank/components/PerformanceAnalytics";
import { ReportDataGridContainer } from "./ReportDataGridContainer";
import type { ExportColumn } from "@/components/ui/ExportToolbar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslation } from "@/hooks/useTranslation";
import { ReportFilterBanner } from "./ReportFilterBanner";
import PinnedWidgets from "./PinnedWidgets";

const QuestionBankReportCharts = lazy(() =>
  import("./QuestionBankReportCharts").then((mod) => ({ default: mod.QuestionBankReportCharts })),
);

type QBReportSubTab = "overview" | "analytics" | "autoGrading";

export interface QuestionBankReportFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  session?: string;
  class?: string;
  student?: string;
}

export interface QuestionBankReportProps {
  filters?: QuestionBankReportFilters;
  onEditVisual?: (config: unknown) => void;
}

const QuestionBankReport = React.memo(function QuestionBankReport({
  filters,
}: QuestionBankReportProps = {}): React.JSX.Element {
  const { t } = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState<QBReportSubTab>("overview");
  const questionsQuery = useQuestionBankQuestions();
  const testsQuery = useQuestionBankTests();
  const resultsQuery = useQuestionBankResults();
  const aggregatesQuery = useQuestionBankReportAggregates();

  const rawQuestions = useQuestionBankQuestionsCollection();
  const tests = useQuestionBankTestsCollection();
  const results = useQuestionBankResultsCollection();

  const questions = useMemo(() => {
    if (!filters) return rawQuestions;
    let filtered = rawQuestions;
    if (filters.status && filters.status !== "all") {
      filtered = filtered.filter((q) => q.difficulty === filters.status);
    }
    return filtered;
  }, [rawQuestions, filters]);

  const questionBankConfig = useQuestionBankConfig(questions);
  const categories = questionBankConfig.categories;

  const tabs: readonly SubTab<QBReportSubTab>[] = useMemo(() => [
    { key: "overview", label: t("reports.builder.title"), icon: BarChart2 },
    { key: "analytics", label: t("questionBank.analytics.studentPerformance"), icon: TrendingUp },
    ...(tests.length > 0
      ? [{ key: "autoGrading" as const, label: t("questionBank.aiGrading"), icon: CheckCircle }]
      : []),
  ], [t, tests.length]);

  const difficultyData = useMemo(() => {
    return questionBankConfig.enabledDifficulties.map((difficulty) => ({
      name: questionBankConfig.difficultyLabel(difficulty),
      questions: questions.filter((question) => question.difficulty === difficulty).length,
      tests: tests.filter((test) => test.difficulty === difficulty).length,
    }));
  }, [questionBankConfig, questions, tests]);

  const categoryData = useMemo(() => {
    return categories.map((category) => ({
      name: category.name,
      questions: questions.filter((question) => getQuestionCategoryIds(question).includes(category.id)).length,
    }));
  }, [categories, questions]);

  const hasDifficultyData = difficultyData.some((item) => item.questions > 0 || item.tests > 0);
  const hasCategoryData = categoryData.some((item) => item.questions > 0);

  const exportColumns = useMemo<ExportColumn[]>(() => [
    { key: "type", header: t("common.type") },
    { key: "name", header: t("common.label") },
    { key: "questions", header: t("questionBank.questions") },
    { key: "tests", header: t("questionBank.report.generatedTests") },
  ], [t]);

  const summaryRows = useMemo(() => [
    ...difficultyData.map((item) => ({
      type: t("questionBank.columns.difficulty"),
      name: item.name,
      questions: item.questions,
      tests: item.tests,
    })),
    ...categoryData.map((item) => ({
      type: t("questionBank.category"),
      name: item.name,
      questions: item.questions,
      tests: "—",
    })),
  ], [difficultyData, categoryData, t]);

  if (questionsQuery.isError || testsQuery.isError || resultsQuery.isError || aggregatesQuery.isError) {
    return (
      <div className="p-4">
        <ErrorState
          title={t("questionBank.loadFailed")}
          description={t("questionBank.loadFailedHint")}
          onRetry={() => {
            void questionsQuery.refetch();
            void testsQuery.refetch();
            void resultsQuery.refetch();
            void aggregatesQuery.refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ReportFilterBanner
        label={t("reports.filters.title")}
        filters={[
          filters?.status && filters.status !== "all"
            ? {
                key: "status",
                value: filters.status,
              }
            : null,
          filters?.dateFrom || filters?.dateTo
            ? {
                key: "date",
                value: `${filters.dateFrom || ""} - ${filters.dateTo || ""}`,
              }
            : null,
        ]}
      />

      <SubTabBar
        tabs={tabs}
        value={activeSubTab}
        onChange={setActiveSubTab}
        panelIdPrefix="qb-report-subtab"
      />

      {activeSubTab === "overview" && (
        <div className="space-y-4">
          <Suspense fallback={<Skeleton className="h-chart-sm w-full rounded-xl" />}>
            <QuestionBankReportCharts
              difficultyData={difficultyData}
              categoryData={categoryData}
              hasDifficultyData={hasDifficultyData}
              hasCategoryData={hasCategoryData}
            />
          </Suspense>

          {summaryRows.length > 0 && (
            <ReportDataGridContainer
              title={t("questionBank.analytics.categoryBreakdown")}
              columns={exportColumns}
              rows={summaryRows as unknown as Record<string, unknown>[]}
              moduleId="questionBank"
              hideExport={summaryRows.length === 0}
            >
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
                      <TableHead className="px-4 py-2.5 font-bold">{t("common.type")}</TableHead>
                      <TableHead className="px-4 py-2.5 font-bold">{t("common.label")}</TableHead>
                      <TableHead className="px-4 py-2.5 font-bold text-center">{t("questionBank.questions")}</TableHead>
                      <TableHead className="px-4 py-2.5 font-bold text-center">{t("questionBank.report.generatedTests")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border/50">
                    {summaryRows.map((row) => (
                      <TableRow key={`${row.type}-${row.name}`} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="px-4 py-2.5 text-xs text-muted-foreground uppercase font-bold">{row.type}</TableCell>
                        <TableCell className="px-4 py-2.5 font-medium text-foreground">{row.name}</TableCell>
                        <TableCell className="px-4 py-2.5 text-center font-mono font-semibold text-primary">{row.questions}</TableCell>
                        <TableCell className="px-4 py-2.5 text-center font-mono text-muted-foreground">{row.tests}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="divide-y divide-border/50 md:hidden" role="list">
                {summaryRows.map((row) => (
                  <div
                    key={`${row.type}-${row.name}`}
                    className="flex min-w-0 items-center justify-between gap-3 px-4 py-3"
                    role="listitem"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{row.name}</p>
                      <p className="text-xs text-muted-foreground uppercase font-bold">{row.type}</p>
                    </div>
                    <div className="text-end">
                      <span className="font-mono font-bold text-primary">{row.questions}</span>
                      <span className="text-xs text-muted-foreground ms-1">{t("questionBank.questions").toLowerCase()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ReportDataGridContainer>
          )}

          <PinnedWidgets category="questionBank" />
        </div>
      )}

      {activeSubTab === "analytics" && (
        <PerformanceAnalytics
          tests={tests}
          results={results}
          questions={questions}
          categories={categories}
        />
      )}

      {activeSubTab === "autoGrading" && tests.length > 0 && (
        <AutoGrading tests={tests} results={results} questions={questions} />
      )}
    </div>
  );
});

export default QuestionBankReport;

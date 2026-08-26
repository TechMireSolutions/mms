import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { AutoGrading } from "@/tenant/features/question-bank/components/AutoGrading";
import { PerformanceAnalytics } from "@/tenant/features/question-bank/components/PerformanceAnalytics";
import KPISummary from "@/components/ui/reports/KPISummary";
import ModuleReports from "@/components/ui/reports/ModuleReports";
import type {
  QuestionBankQuestion,
  QuestionBankResult,
  QuestionBankTest,
  QuestionCategory,
} from "@mms/shared";

interface QuestionBankReportsTierProps {
  tests: QuestionBankTest[];
  results: QuestionBankResult[];
  questions: QuestionBankQuestion[];
  categories: QuestionCategory[];
}

export function QuestionBankReportsTier({
  tests,
  results,
  questions,
  categories,
}: QuestionBankReportsTierProps) {
  return (
    <ErrorBoundary>
      <div className="space-y-4">
        <KPISummary category="questionBank" />
        <ModuleReports category="questionBank" />
        <PerformanceAnalytics
          tests={tests}
          results={results}
          questions={questions}
          categories={categories}
        />
        {tests.length > 0 && (
          <AutoGrading tests={tests} results={results} questions={questions} />
        )}
      </div>
    </ErrorBoundary>
  );
}

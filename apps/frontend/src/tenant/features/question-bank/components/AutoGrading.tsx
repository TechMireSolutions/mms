import React, { useState, useMemo } from "react";
import {
  calcPercentage as pct,
  type QuestionBankQuestion as Question,
  type QuestionBankResult,
  type QuestionBankTest,
} from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { sumScores, testTotalMarks, type StatsSummary } from "@/tenant/features/question-bank/components/autoGradingShared";
import { AutoGradingResultRow } from "@/tenant/features/question-bank/components/AutoGradingResultRow";
import { AutoGradingStats } from "@/tenant/features/question-bank/components/AutoGradingStats";

interface AutoGradingProps {
  tests: QuestionBankTest[];
  results: QuestionBankResult[];
  questions: Question[];
}

export function AutoGrading({ tests, results, questions }: AutoGradingProps): React.ReactElement {
  const { t } = useTranslation();
  const [selectedTest, setSelectedTest] = useState<string>(tests[0]?.id || "");
  const test = tests.find((item) => item.id === selectedTest);
  const testResults = results.filter((result) => result.testId === selectedTest);

  const stats = useMemo<StatsSummary | null>(() => {
    if (!test || testResults.length === 0) return null;
    const totalMarks = testTotalMarks(test, questions) || 100;
    const averageScore = Math.round(
      testResults.reduce((scoreTotal, result) => scoreTotal + pct(sumScores(result.scores), totalMarks), 0) / testResults.length,
    );
    const highest = Math.max(...testResults.map((result) => sumScores(result.scores)));
    const lowest = Math.min(...testResults.map((result) => sumScores(result.scores)));
    return { avg: averageScore, highest, lowest };
  }, [test, testResults, questions]);

  return (
    <section className="space-y-5" aria-labelledby="auto-grading-title">
      <div>
        <span id="auto-grading-title" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("questionBank.grading.selectTest")}
        </span>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("questionBank.grading.selectTestAria")}>
          {tests.map((item) => {
            const isSelected = selectedTest === item.id;
            const count = results.filter((result) => result.testId === item.id).length;
            return (
              <Button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelectedTest(item.id)}
                className={`rounded-lg border px-3.5 py-2 text-sm font-semibold transition-all h-auto shadow-none ${isSelected ? "border-primary bg-primary/5 text-primary hover:bg-primary/10" : "border-border bg-card text-foreground hover:bg-muted"}`}
              >
                {item.name}
                <span className="ms-1.5 text-xs text-muted-foreground">
                  ({t("questionBank.grading.resultsCount", { count })})
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      {test && (
        <>
          {stats && (
            <AutoGradingStats stats={stats} test={test} questions={questions} submittedCount={testResults.length} />
          )}

          <section className="overflow-hidden rounded-xl border border-border bg-card" aria-label={t("questionBank.grading.resultsTitle", { name: test.name })}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
              <h3 className="m-0 min-w-0 truncate text-sm font-bold text-foreground">
                {t("questionBank.grading.resultsTitle", { name: test.name })}
              </h3>
              <span className="shrink-0 text-xs text-muted-foreground">
                {t("questionBank.grading.submissionsCount", { count: testResults.length })}
              </span>
            </div>
            {testResults.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground" role="status">
                {t("questionBank.grading.noResults")}
              </div>
            ) : (
              <div role="list">
                {testResults
                  .sort((a, b) => sumScores(b.scores) - sumScores(a.scores))
                  .map((result) => (
                    <AutoGradingResultRow key={result.id} result={result} test={test} questions={questions} />
                  ))}
              </div>
            )}
          </section>
        </>
      )}
    </section>
  );
}

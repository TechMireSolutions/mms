import React, { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart2, ClipboardList, FileCheck2, Target, Users } from "lucide-react";
import type {
  QuestionBankQuestion,
  QuestionBankResult,
  QuestionBankTest,
} from "@mms/shared";
import { getQuestionCategoryIds } from "@mms/shared";
import { RESULTS, QUESTIONS, TESTS } from "../../lib/questionBankData";
import { useLiveCollection } from "../../hooks/useLiveCollection";
import useTranslation from "@/hooks/useTranslation";
import { useQuestionBankConfig } from "@/hooks/useQuestionBankConfig";
import ReportSummaryCard from "./ReportSummaryCard";
import EmptyState from "../ui/EmptyState";

function sumScores(scores: Record<string, number>): number {
  return Object.values(scores).reduce((sum, value) => sum + value, 0);
}

function testTotalMarks(test: QuestionBankTest, questions: QuestionBankQuestion[]): number {
  return test.questionIds.reduce((sum, qid) => {
    const question = questions.find((item) => item.id === qid);
    return sum + (question?.marks ?? 0);
  }, 0);
}

export default function QuestionBankReport(): React.JSX.Element {
  const { t } = useTranslation();
  const questions = useLiveCollection<QuestionBankQuestion>("questions", QUESTIONS);
  const tests = useLiveCollection<QuestionBankTest>("tests", TESTS);
  const results = useLiveCollection<QuestionBankResult>("assessment_results", RESULTS);
  const config = useQuestionBankConfig(questions);

  const avgScore = useMemo(() => {
    const scored = results
      .map((result) => {
        const test = tests.find((item) => item.id === result.testId);
        if (!test) return null;
        const total = testTotalMarks(test, questions);
        return total > 0 ? Math.round((sumScores(result.scores) / total) * 100) : null;
      })
      .filter((value): value is number => value !== null);

    return scored.length
      ? Math.round(scored.reduce((sum, value) => sum + value, 0) / scored.length)
      : 0;
  }, [questions, results, tests]);

  const difficultyData = config.enabledDifficulties.map((difficulty) => ({
    name: config.difficultyLabel(difficulty),
    questions: questions.filter((question) => question.difficulty === difficulty).length,
    tests: tests.filter((test) => test.difficulty === difficulty).length,
  }));

  const categoryData = config.categories.map((category) => ({
    name: category.name,
    questions: questions.filter((question) => getQuestionCategoryIds(question).includes(category.id)).length,
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ReportSummaryCard
          icon={ClipboardList}
          label={t("questionBank.report.totalQuestions")}
          value={questions.length}
          color="primary"
        />
        <ReportSummaryCard
          icon={FileCheck2}
          label={t("questionBank.report.generatedTests")}
          value={tests.length}
          color="blue"
        />
        <ReportSummaryCard
          icon={Users}
          label={t("questionBank.report.submissions")}
          value={results.length}
          color="violet"
        />
        <ReportSummaryCard
          icon={Target}
          label={t("questionBank.report.avgScore")}
          value={`${avgScore}%`}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section
          className="rounded-2xl border border-border/50 bg-card/40 p-5 shadow-sm backdrop-blur-xl"
          aria-label={t("questionBank.analytics.difficultyBreakdown")}
        >
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            {t("questionBank.analytics.difficultyBreakdown")}
          </h3>
          {difficultyData.some((item) => item.questions > 0 || item.tests > 0) ? (
            <div className="h-[180px]" aria-hidden>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={difficultyData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="questions" name={t("questionBank.questions")} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="tests" name={t("questionBank.report.generatedTests")} fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon={BarChart2} title={t("questionBank.report.noDifficultyData")} compact />
          )}
        </section>

        <section
          className="rounded-2xl border border-border/50 bg-card/40 p-5 shadow-sm backdrop-blur-xl"
          aria-label={t("questionBank.analytics.categoryBreakdown")}
        >
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            {t("questionBank.analytics.categoryBreakdown")}
          </h3>
          {categoryData.some((item) => item.questions > 0) ? (
            <div className="h-[180px]" aria-hidden>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={categoryData} barSize={28} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={96} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="questions" name={t("questionBank.questions")} fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon={BarChart2} title={t("questionBank.report.noCategoryData")} compact />
          )}
        </section>
      </div>
    </div>
  );
}

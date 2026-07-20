import React, { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import SafeResponsiveContainer from "@/components/ui/SafeResponsiveContainer";
import { SectionCard } from "@/components/ui/SectionCard";
import { BarChart2, ClipboardList, FileCheck2, Target, Users } from "lucide-react";
import type {
  QuestionBankQuestion,
  QuestionBankTest,
} from "@mms/shared";
import { getQuestionCategoryIds } from "@mms/shared";
import {
  useQuestionBankQuestionsCollection,
  useQuestionBankTestsCollection,
  useQuestionBankResultsCollection,
} from "@/tenant/features/question-bank/hooks/useQuestionBankApi";
import { useTranslation } from "@/hooks/useTranslation";
import { useQuestionBankConfig } from "@/tenant/features/question-bank/hooks/useQuestionBankConfig";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";

function sumScores(scores: Record<string, number>): number {
  return Object.values(scores).reduce((sum, value) => sum + value, 0);
}

function testTotalMarks(test: QuestionBankTest, questions: QuestionBankQuestion[]): number {
  return test.questionIds.reduce((sum, questionId) => {
    const question = questions.find((questionBankQuestion) => questionBankQuestion.id === questionId);
    return sum + (question?.marks ?? 0);
  }, 0);
}

export default function QuestionBankReport(): React.JSX.Element {
  const { t } = useTranslation();
  const questions = useQuestionBankQuestionsCollection();
  const tests = useQuestionBankTestsCollection();
  const questionBankResults = useQuestionBankResultsCollection();
  const questionBankConfig = useQuestionBankConfig(questions);

  const avgScore = useMemo(() => {
    const scored = questionBankResults
      .map((questionBankResult) => {
        const test = tests.find((questionBankTest) => questionBankTest.id === questionBankResult.testId);
        if (!test) return null;
        const total = testTotalMarks(test, questions);
        return total > 0 ? Math.round((sumScores(questionBankResult.scores) / total) * 100) : null;
      })
      .filter((value): value is number => value !== null);

    return scored.length
      ? Math.round(scored.reduce((sum, value) => sum + value, 0) / scored.length)
      : 0;
  }, [questions, questionBankResults, tests]);

  const difficultyData = questionBankConfig.enabledDifficulties.map((difficulty) => ({
    name: questionBankConfig.difficultyLabel(difficulty),
    questions: questions.filter((question) => question.difficulty === difficulty).length,
    tests: tests.filter((test) => test.difficulty === difficulty).length,
  }));

  const categoryData = questionBankConfig.categories.map((category) => ({
    name: category.name,
    questions: questions.filter((question) => getQuestionCategoryIds(question).includes(category.id)).length,
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={ClipboardList}
          label={t("questionBank.report.totalQuestions")}
          value={questions.length}
          color="primary"
        />
        <StatCard
          icon={FileCheck2}
          label={t("questionBank.report.generatedTests")}
          value={tests.length}
          color="blue"
        />
        <StatCard
          icon={Users}
          label={t("questionBank.report.submissions")}
          value={questionBankResults.length}
          color="violet"
        />
        <StatCard
          icon={Target}
          label={t("questionBank.report.avgScore")}
          value={`${avgScore}%`}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title={t("questionBank.analytics.difficultyBreakdown")}>
          {difficultyData.some((item) => item.questions > 0 || item.tests > 0) ? (
            <div className="h-[180px]" aria-hidden>
              <SafeResponsiveContainer width="100%" height={180}>
                <BarChart data={difficultyData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="questions" name={t("questionBank.questions")} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="tests" name={t("questionBank.report.generatedTests")} fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </SafeResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon={BarChart2} title={t("questionBank.report.noDifficultyData")} compact />
          )}
        </SectionCard>

        <SectionCard title={t("questionBank.analytics.categoryBreakdown")}>
          {categoryData.some((item) => item.questions > 0) ? (
            <div className="h-[180px]" aria-hidden>
              <SafeResponsiveContainer width="100%" height={180}>
                <BarChart data={categoryData} barSize={28} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={96} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="questions" name={t("questionBank.questions")} fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </SafeResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon={BarChart2} title={t("questionBank.report.noCategoryData")} compact />
          )}
        </SectionCard>
      </div>
    </div>
  );
}

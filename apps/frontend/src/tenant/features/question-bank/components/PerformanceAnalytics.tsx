import React, { useMemo } from "react";
import {
  getQuestionCategoryIds,
  QUESTION_ACCURACY_WEAK_THRESHOLD,
  calcPercentage as pct,
} from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { useQuestionBankConfig } from "@/tenant/features/question-bank/hooks/useQuestionBankConfig";
import { PerformanceAnalyticsPanels } from "./PerformanceAnalyticsPanels";
import {
  sumScores,
  testTotalMarks,
  type PerformanceAnalyticsProps,
  type StudentStatItem,
  type CategoryPerformance,
} from "./performanceAnalyticsUtils";

export type { PerformanceAnalyticsProps } from "./performanceAnalyticsUtils";

export function PerformanceAnalytics({
  tests,
  results,
  questions,
  categories,
}: PerformanceAnalyticsProps): React.ReactElement {
  const { t } = useTranslation();
  const qbConfig = useQuestionBankConfig(questions);

  const studentStats = useMemo<StudentStatItem[]>(() => {
    const statsByStudentId: Record<string, { name: string; class: string; scores: number[]; totalPts: number; maxPts: number }> = {};
    results.forEach((result) => {
      const test = tests.find((item) => item.id === result.testId);
      if (!test) return;
      const totalMarks = testTotalMarks(test, questions) || 100;
      const marksObtained = sumScores(result.scores);
      const percentageScore = pct(marksObtained, totalMarks);
      if (!statsByStudentId[result.studentId]) {
        statsByStudentId[result.studentId] = {
          name: result.studentName,
          class: t("questionBank.analytics.classLabel"),
          scores: [],
          totalPts: 0,
          maxPts: 0,
        };
      }
      statsByStudentId[result.studentId].scores.push(percentageScore);
      statsByStudentId[result.studentId].totalPts += marksObtained;
      statsByStudentId[result.studentId].maxPts += totalMarks;
    });
    return Object.values(statsByStudentId)
      .map((studentStat) => {
        const averageScore = studentStat.scores.length > 0 ? Math.round(studentStat.scores.reduce((scoreTotal, score) => scoreTotal + score, 0) / studentStat.scores.length) : 0;
        return { ...studentStat, avg: averageScore, overall: pct(studentStat.totalPts, studentStat.maxPts) };
      })
      .sort((a, b) => b.avg - a.avg);
  }, [tests, results, questions, t]);

  const catPerformance = useMemo<CategoryPerformance[]>(() => {
    return categories
      .map((category) => {
        const categoryQuestionIds = questions
          .filter((question) => getQuestionCategoryIds(question).includes(category.id))
          .map((question) => question.id);
        let correct = 0;
        let total = 0;
        results.forEach((result) => {
          categoryQuestionIds.forEach((questionId) => {
            if (result.answers?.[questionId] !== undefined) {
              const question = questions.find((candidateQuestion) => candidateQuestion.id === questionId);
              total++;
              if (result.answers[questionId] === question?.answer) correct++;
            }
          });
        });
        const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
        return { name: category.name, icon: category.icon, color: category.color, accuracy, correct, total };
      })
      .filter((categoryResult) => categoryResult.total > 0);
  }, [categories, questions, results]);

  const weakAreas = catPerformance
    .filter((categoryResult) => categoryResult.accuracy < QUESTION_ACCURACY_WEAK_THRESHOLD)
    .sort((a, b) => a.accuracy - b.accuracy);

  const trendData = tests.map((test) => {
    const testResults = results.filter((result) => result.testId === test.id);
    const totalMarks = testTotalMarks(test, questions) || 100;
    const averageScore =
      testResults.length > 0
        ? Math.round(testResults.reduce((scoreTotal, result) => scoreTotal + pct(sumScores(result.scores), totalMarks), 0) / testResults.length)
        : 0;
    return {
      name: test.name.length > 16 ? `${test.name.slice(0, 16)}…` : test.name,
      avg: averageScore,
    };
  });

  const diffData = qbConfig.enabledDifficulties.map((difficulty) => {
    const questionIds = questions.filter((question) => question.difficulty === difficulty).map((question) => question.id);
    let correct = 0;
    let total = 0;
    results.forEach((result) => {
      questionIds.forEach((questionId) => {
        if (result.answers?.[questionId] !== undefined) {
          const question = questions.find((candidateQuestion) => candidateQuestion.id === questionId);
          total++;
          if (result.answers[questionId] === question?.answer) correct++;
        }
      });
    });
    return {
      name: qbConfig.difficultyLabel(difficulty),
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
    };
  });

  const radarData = catPerformance.map((categoryResult) => ({ subject: `${categoryResult.icon} ${categoryResult.name}`, accuracy: categoryResult.accuracy }));

  return (
    <PerformanceAnalyticsPanels
      weakAreas={weakAreas}
      trendData={trendData}
      radarData={radarData}
      studentStats={studentStats}
      diffData={diffData}
      catPerformance={catPerformance}
    />
  );
}
